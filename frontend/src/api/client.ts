import { getIdToken } from "../auth/cognito";
import {
  ApiError,
  type AdvisorResponse,
  type BillingSnapshot,
  type CostEstimate,
  type EstimateInput,
  type OperationRecord,
  type ReportResult,
  type ResourceRecord,
  type ResourceSummary,
} from "../types";
import { mockApi } from "./mock";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (USE_MOCK) {
    return mockApi(path, init) as Promise<T>;
  }
  const base = (import.meta.env.VITE_API_URL || `${window.location.origin}/api`).replace(/\/$/, "");
  const token = await getIdToken();
  const headers = new Headers(init.headers);
  if (init.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${base}${path}`, { ...init, headers });
  const text = await res.text();
  const body = text ? JSON.parse(text) : {};
  if (!res.ok) {
    throw new ApiError(body.error || "Request failed.", res.status, body.code);
  }
  return body as T;
}

export const api = {
  summary: (region: string) =>
    request<{ region: string; summaries: ResourceSummary[] }>(`/resources/summary?region=${region}`),
  resources: (region: string, service?: string, q?: string) => {
    const params = new URLSearchParams({ region });
    if (service) params.set("service", service);
    if (q) params.set("q", q);
    return request<{ resources: ResourceRecord[]; services: Record<string, { status: string; message?: string }> }>(
      `/resources?${params.toString()}`,
    );
  },
  resource: (region: string, service: string, id: string) =>
    request<{ resource: ResourceRecord }>(
      `/resources/${encodeURIComponent(id)}?region=${region}&service=${service}`,
    ),
  billing: (region: string) => request<{ billing: BillingSnapshot }>(`/billing?region=${region}`),
  estimate: (input: EstimateInput) =>
    request<{ estimate: CostEstimate; cheaperOptions: CostEstimate[] }>("/estimate", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  createEc2: (input: EstimateInput & { confirm: boolean; name?: string }) =>
    request<{ operation: OperationRecord }>("/resources/ec2", {
      method: "POST",
      body: JSON.stringify({
        region: input.region,
        instanceType: input.instanceType,
        volumeType: input.volumeType,
        volumeSizeGiB: input.volumeSizeGiB,
        confirm: input.confirm,
        name: input.name,
      }),
    }),
  advisor: (region: string) =>
    request<{ advisor: AdvisorResponse }>("/advisor", { method: "POST", body: JSON.stringify({ region }) }),
  report: (region: string, plannedEstimate?: EstimateInput) =>
    request<{ report: ReportResult }>("/reports", {
      method: "POST",
      body: JSON.stringify({ region, plannedEstimate }),
    }),
  operation: (id: string, region: string) =>
    request<{ operation: OperationRecord }>(`/operations/${id}?region=${region}`),
};
