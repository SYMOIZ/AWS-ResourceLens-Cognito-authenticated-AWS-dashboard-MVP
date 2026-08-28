import { GetCostAndUsageCommand } from "@aws-sdk/client-cost-explorer";
import type { AwsClients } from "../../services/aws/clients.js";
import type { BillingSnapshot } from "../../types/index.js";
import { isAccessDenied } from "../../utils/errors.js";
import { logError } from "../../utils/logger.js";

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function getBilling(clients: AwsClients): Promise<BillingSnapshot> {
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const historyStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 13));
  const endExclusive = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));

  try {
    const [monthly, daily] = await Promise.all([
      clients.costExplorer.send(
        new GetCostAndUsageCommand({
          TimePeriod: { Start: ymd(monthStart), End: ymd(endExclusive) },
          Granularity: "MONTHLY",
          Metrics: ["UnblendedCost"],
        }),
      ),
      clients.costExplorer.send(
        new GetCostAndUsageCommand({
          TimePeriod: { Start: ymd(historyStart), End: ymd(endExclusive) },
          Granularity: "DAILY",
          Metrics: ["UnblendedCost"],
        }),
      ),
    ]);

    const amount = monthly.ResultsByTime?.[0]?.Total?.UnblendedCost?.Amount;
    const unit = monthly.ResultsByTime?.[0]?.Total?.UnblendedCost?.Unit;
    const days = (daily.ResultsByTime ?? []).map((row) => ({
      date: row.TimePeriod?.Start ?? "",
      amountUsd: Number(row.Total?.UnblendedCost?.Amount ?? 0),
      estimated: row.Estimated === true,
    }));
    const latest = days.at(-1);

    if (amount === undefined && days.length === 0) {
      return {
        available: false,
        message: "Billing data is unavailable. Please verify Cost Explorer/IAM permissions.",
      };
    }

    return {
      available: true,
      periodStart: ymd(monthStart),
      periodEnd: ymd(endExclusive),
      amountUsd: amount !== undefined ? Number(amount) : undefined,
      todayUsd: latest?.amountUsd,
      todayDate: latest?.date,
      currency: unit ?? "USD",
      daily: days,
      message:
        "Cost Explorer figures come from AWS billing data. The latest day is often delayed by up to 24 hours and may be marked estimated.",
    };
  } catch (error) {
    logError("Cost Explorer request failed", { message: (error as Error).message });
    if (isAccessDenied(error)) {
      return {
        available: false,
        message: "Billing data is unavailable. Please verify Cost Explorer/IAM permissions.",
      };
    }
    return {
      available: false,
      message: "Billing information is unavailable for this account.",
    };
  }
}
