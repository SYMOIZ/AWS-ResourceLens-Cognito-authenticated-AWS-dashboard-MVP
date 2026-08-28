/**
 * Local-only mock adapter. Never used in production unless VITE_USE_MOCK=true.
 * Values are labeled as mock and are not real AWS inventory or billing.
 */
import type { AdvisorResponse, BillingSnapshot, CostEstimate, ResourceRecord, ResourceSummary } from "../types";

const MOCK_NOTICE = "Mock mode is enabled. This is not live AWS data.";

export async function mockApi(path: string, init: RequestInit): Promise<unknown> {
  await new Promise((r) => setTimeout(r, 250));
  const url = new URL(path, "https://mock.local");
  if (url.pathname === "/resources/summary") {
    const summaries: ResourceSummary[] = [
      { service: "ec2", count: 0, status: "ok" },
      { service: "s3", count: 0, status: "ok" },
      { service: "lambda", count: 0, status: "ok" },
      { service: "rds", count: 0, status: "ok" },
      { service: "dynamodb", count: 0, status: "ok" },
      { service: "vpc", count: 0, status: "ok" },
    ];
    return { region: url.searchParams.get("region"), summaries, notice: MOCK_NOTICE };
  }
  if (url.pathname === "/resources") {
    const resources: ResourceRecord[] = [];
    return { resources, services: {}, notice: MOCK_NOTICE };
  }
  if (url.pathname === "/billing") {
    const billing: BillingSnapshot = {
      available: false,
      message: "Mock mode: billing is not queried. Disable VITE_USE_MOCK to use Cost Explorer.",
    };
    return { billing };
  }
  if (url.pathname === "/estimate" && init.method === "POST") {
    const estimate: CostEstimate = {
      label: "ESTIMATE",
      currency: "USD",
      hourly: 0,
      monthly: 0,
      yearly: 0,
      breakdown: [],
      source: "unavailable",
      disclaimer: "Mock mode does not call the AWS Price List API.",
    };
    return { estimate };
  }
  if (url.pathname === "/advisor") {
    const advisor: AdvisorResponse = {
      available: false,
      recommendations: [],
      observations: [],
      disclaimer: "AI recommendations are suggestions. Review AWS configuration and pricing before making infrastructure changes.",
      message: MOCK_NOTICE,
    };
    return { advisor };
  }
  throw new Error("Mock adapter does not implement this route.");
}
