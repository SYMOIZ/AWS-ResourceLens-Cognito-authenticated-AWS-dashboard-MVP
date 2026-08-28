import { GetProductsCommand } from "@aws-sdk/client-pricing";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import type { CostEstimate, EstimateRequest } from "../../types/index.js";
import type { AwsClients } from "../aws/clients.js";
import { logError, logInfo } from "../../utils/logger.js";

export const ESTIMATE_DISCLAIMER =
  "ESTIMATE from the AWS Price List API (On-Demand). This is not your AWS invoice. Discounts, Free Tier, data transfer, and taxes are not included.";

const REGION_LOCATION: Record<string, string> = {
  "us-east-1": "US East (N. Virginia)",
  "us-east-2": "US East (Ohio)",
  "us-west-1": "US West (N. California)",
  "us-west-2": "US West (Oregon)",
  "ca-central-1": "Canada (Central)",
  "eu-west-1": "EU (Ireland)",
  "eu-west-2": "EU (London)",
  "eu-central-1": "EU (Frankfurt)",
  "ap-south-1": "Asia Pacific (Mumbai)",
  "ap-southeast-1": "Asia Pacific (Singapore)",
  "ap-southeast-2": "Asia Pacific (Sydney)",
  "ap-northeast-1": "Asia Pacific (Tokyo)",
  "sa-east-1": "South America (Sao Paulo)",
};

export const COMPARE_INSTANCE_TYPES = [
  "t3.nano",
  "t3.micro",
  "t3.small",
  "t3.medium",
  "t3.large",
];

export interface PricingProvider {
  estimateEc2(input: EstimateRequest): Promise<CostEstimate>;
}

interface PriceListProduct {
  product?: { attributes?: { operation?: string; volumeApiName?: string; productFamily?: string } };
  terms?: {
    OnDemand?: Record<
      string,
      {
        priceDimensions?: Record<
          string,
          { unit?: string; pricePerUnit?: { USD?: string }; description?: string }
        >;
      }
    >;
  };
}

function onDemandUsdForUnit(parsed: PriceListProduct, unit: string): number | null {
  const onDemand = parsed.terms?.OnDemand;
  if (!onDemand) return null;
  for (const term of Object.values(onDemand)) {
    for (const dim of Object.values(term.priceDimensions ?? {})) {
      if (dim.unit !== unit) continue;
      const n = Number(dim.pricePerUnit?.USD);
      if (Number.isFinite(n) && n > 0) return n;
    }
  }
  return null;
}

function parseProduct(raw: string): PriceListProduct | null {
  try {
    return JSON.parse(raw) as PriceListProduct;
  } catch {
    return null;
  }
}

export class AwsPricingProvider implements PricingProvider {
  constructor(private readonly clients: AwsClients) {}

  async estimateEc2(input: EstimateRequest): Promise<CostEstimate> {
    const location = REGION_LOCATION[input.region];
    if (!location) return unavailable(`Region ${input.region} is not mapped to a Price List location.`);

    const cacheKey = `PRICE#ec2#${input.region}#${input.instanceType}#${input.operatingSystem}#${input.volumeType}`;
    const cached = await this.readCache(cacheKey);
    const hourlyCompute = cached?.hourlyCompute ?? (await this.fetchComputeHourly(location, input));
    const monthlyStorageGiB = cached?.monthlyStorageGiB ?? (await this.fetchStorageMonthly(location, input.volumeType));

    if (hourlyCompute === null) {
      return unavailable("AWS Price List did not return an On-Demand compute rate for this instance type.");
    }
    if (monthlyStorageGiB === null) {
      return unavailable("AWS Price List did not return an On-Demand EBS GB-month rate for this volume type.");
    }

    await this.writeCache(cacheKey, { hourlyCompute, monthlyStorageGiB });
    return computeFromRates(input, hourlyCompute, monthlyStorageGiB);
  }

  async compareCheaper(input: EstimateRequest): Promise<CostEstimate[]> {
    const types = COMPARE_INSTANCE_TYPES.filter((t) => t !== input.instanceType);
    const estimates = await Promise.all(
      types.map((instanceType) => this.estimateEc2({ ...input, instanceType })),
    );
    return estimates
      .filter((e) => e.source === "aws-pricing-api")
      .sort((a, b) => a.monthly - b.monthly);
  }

  private computeOperation(os: string): string {
    return os === "Windows" ? "RunInstances:0002" : "RunInstances";
  }

  private async fetchComputeHourly(location: string, input: EstimateRequest): Promise<number | null> {
    try {
      const result = await this.clients.pricing.send(
        new GetProductsCommand({
          ServiceCode: "AmazonEC2",
          FormatVersion: "aws_v1",
          MaxResults: 25,
          Filters: [
            { Type: "TERM_MATCH", Field: "location", Value: location },
            { Type: "TERM_MATCH", Field: "instanceType", Value: input.instanceType },
            { Type: "TERM_MATCH", Field: "operatingSystem", Value: input.operatingSystem },
            { Type: "TERM_MATCH", Field: "tenancy", Value: "Shared" },
            { Type: "TERM_MATCH", Field: "capacitystatus", Value: "Used" },
            { Type: "TERM_MATCH", Field: "preInstalledSw", Value: "NA" },
            { Type: "TERM_MATCH", Field: "operation", Value: this.computeOperation(input.operatingSystem) },
          ],
        }),
      );
      for (const raw of result.PriceList ?? []) {
        const parsed = parseProduct(raw);
        if (!parsed) continue;
        const usd = onDemandUsdForUnit(parsed, "Hrs");
        if (usd !== null) return usd;
      }
      return null;
    } catch (error) {
      logError("Pricing API compute lookup failed", { message: (error as Error).message });
      return null;
    }
  }

  private async fetchStorageMonthly(location: string, volumeType: string): Promise<number | null> {
    try {
      const result = await this.clients.pricing.send(
        new GetProductsCommand({
          ServiceCode: "AmazonEC2",
          FormatVersion: "aws_v1",
          MaxResults: 25,
          Filters: [
            { Type: "TERM_MATCH", Field: "location", Value: location },
            { Type: "TERM_MATCH", Field: "productFamily", Value: "Storage" },
            { Type: "TERM_MATCH", Field: "volumeApiName", Value: volumeType },
          ],
        }),
      );
      for (const raw of result.PriceList ?? []) {
        const parsed = parseProduct(raw);
        if (!parsed) continue;
        const usd = onDemandUsdForUnit(parsed, "GB-Mo");
        if (usd !== null) return usd;
      }
      return null;
    } catch (error) {
      logError("Pricing API storage lookup failed", { message: (error as Error).message });
      return null;
    }
  }

  private async readCache(pk: string): Promise<{ hourlyCompute: number; monthlyStorageGiB: number } | null> {
    const table = process.env.OPERATIONS_TABLE;
    if (!table) return null;
    try {
      const item = await this.clients.appDoc.send(
        new GetCommand({ TableName: table, Key: { pk, sk: "CACHE" } }),
      );
      const ttl = item.Item?.ttl as number | undefined;
      if (ttl && ttl < Math.floor(Date.now() / 1000)) return null;
      if (item.Item?.hourlyCompute != null && item.Item?.monthlyStorageGiB != null) {
        return {
          hourlyCompute: Number(item.Item.hourlyCompute),
          monthlyStorageGiB: Number(item.Item.monthlyStorageGiB),
        };
      }
    } catch (error) {
      logInfo("Price cache miss", { message: (error as Error).message });
    }
    return null;
  }

  private async writeCache(
    pk: string,
    rates: { hourlyCompute: number; monthlyStorageGiB: number },
  ): Promise<void> {
    const table = process.env.OPERATIONS_TABLE;
    if (!table) return;
    try {
      await this.clients.appDoc.send(
        new PutCommand({
          TableName: table,
          Item: {
            pk,
            sk: "CACHE",
            ...rates,
            ttl: Math.floor(Date.now() / 1000) + 86400,
          },
        }),
      );
    } catch {
      /* cache is best-effort */
    }
  }
}

export function unavailable(reason?: string): CostEstimate {
  return {
    label: "ESTIMATE",
    currency: "USD",
    hourly: 0,
    monthly: 0,
    yearly: 0,
    breakdown: [],
    source: "unavailable",
    disclaimer:
      reason ||
      "Pricing data is unavailable from the AWS Price List API. No estimated amount is shown.",
  };
}

export function computeFromRates(
  input: EstimateRequest,
  hourlyCompute: number,
  monthlyStorageGiB: number,
): CostEstimate {
  const computeMonthly = hourlyCompute * input.hoursPerMonth;
  const storageMonthly = monthlyStorageGiB * input.volumeSizeGiB;
  const monthly = round2(computeMonthly + storageMonthly);
  return {
    label: "ESTIMATE",
    currency: "USD",
    hourly: round4(hourlyCompute + storageMonthly / Math.max(input.hoursPerMonth, 1)),
    monthly,
    yearly: round2(monthly * 12),
    breakdown: [
      { component: `EC2 ${input.instanceType} On-Demand ${input.operatingSystem} @ $${hourlyCompute.toFixed(4)}/hr`, monthlyUsd: round2(computeMonthly) },
      { component: `EBS ${input.volumeType} ${input.volumeSizeGiB} GiB @ $${monthlyStorageGiB.toFixed(4)}/GB-month`, monthlyUsd: round2(storageMonthly) },
    ],
    source: "aws-pricing-api",
    disclaimer: ESTIMATE_DISCLAIMER,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}
