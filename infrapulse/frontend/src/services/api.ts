import type {
  ApiError,
  AppStatus,
  GenerateResponse,
  InfrastructureInsight,
  InsightListResponse,
  PublicSettings,
  SchedulerRunResponse,
  Topic,
} from "../types/api";

const API_BASE = import.meta.env.VITE_API_BASE ?? "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  if (response.status === 204) {
    return null as T;
  }

  const data = (await response.json()) as T | ApiError;
  if (!response.ok) {
    const err = data as ApiError;
    const message = err.error?.message ?? `Request failed (${response.status})`;
    throw new Error(message);
  }
  return data as T;
}

export const api = {
  health: () => request<{ status: string }>("/api/health"),
  status: () => request<AppStatus>("/api/status"),
  generate: () =>
    request<GenerateResponse>("/api/insights/generate", { method: "POST" }),
  today: () => request<InfrastructureInsight | null>("/api/insights/today"),
  insights: (params?: { q?: string; category?: string; topic?: string }) => {
    const search = new URLSearchParams();
    if (params?.q) search.set("q", params.q);
    if (params?.category) search.set("category", params.category);
    if (params?.topic) search.set("topic", params.topic);
    const suffix = search.toString() ? `?${search.toString()}` : "";
    return request<InsightListResponse>(`/api/insights${suffix}`);
  },
  insight: (id: number) => request<InfrastructureInsight>(`/api/insights/${id}`),
  topics: () => request<Topic[]>("/api/topics"),
  createTopic: (payload: { name: string; category: string }) =>
    request<Topic>("/api/topics", { method: "POST", body: JSON.stringify(payload) }),
  patchTopic: (id: number, payload: { enabled?: boolean }) =>
    request<Topic>(`/api/topics/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  settings: () => request<PublicSettings>("/api/settings"),
  patchSettings: (payload: Partial<PublicSettings>) =>
    request<PublicSettings>("/api/settings", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  runScheduler: () =>
    request<SchedulerRunResponse>("/api/scheduler/run", { method: "POST" }),
};
