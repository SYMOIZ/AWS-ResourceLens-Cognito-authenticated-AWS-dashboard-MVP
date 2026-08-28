export interface InfrastructureInsight {
  id: number;
  title: string;
  topic: string;
  category: string;
  summary: string;
  real_world_scenario: string;
  technical_explanation: string;
  architecture: string;
  best_practices: string[];
  practical_recommendation: string;
  common_mistakes: string[];
  what_to_learn_next: string[];
  tags: string[];
  generated_at: string;
  generation_source: string;
}

export interface InsightListResponse {
  items: InfrastructureInsight[];
  total: number;
}

export interface SchedulerStatus {
  enabled: boolean;
  running: boolean;
  schedule_time: string;
  timezone: string;
  next_run_at: string | null;
  last_run_at: string | null;
  last_run_status: string | null;
  last_error: string | null;
}

export interface AppStatus {
  status: string;
  app: string;
  version: string;
  environment: string;
  demo_mode: boolean;
  ai_provider: string;
  scheduler: SchedulerStatus;
  generation_in_progress: boolean;
  total_insights: number;
  last_successful_generation: string | null;
}

export interface Topic {
  id: number;
  name: string;
  category: string;
  enabled: boolean;
  last_used_at: string | null;
}

export interface PublicSettings {
  ai_provider: string;
  scheduler_enabled: boolean;
  schedule_time: string;
  timezone: string;
  demo_mode: boolean;
  app_name: string;
  app_version: string;
  environment: string;
}

export interface GenerateResponse {
  insight: InfrastructureInsight;
  message: string;
}

export interface SchedulerRunResponse {
  skipped: boolean;
  reason: string | null;
  insight_id: number | null;
  message: string;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
