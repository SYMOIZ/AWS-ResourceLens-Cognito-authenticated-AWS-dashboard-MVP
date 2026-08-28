export const ALLOWED_REGIONS = [
  "us-east-1",
  "us-east-2",
  "us-west-1",
  "us-west-2",
  "ca-central-1",
  "eu-west-1",
  "eu-west-2",
  "eu-central-1",
  "ap-south-1",
  "ap-southeast-1",
  "ap-southeast-2",
  "ap-northeast-1",
  "sa-east-1",
] as const;

export const IMPLEMENTED_SERVICES = ["ec2", "s3", "lambda", "rds", "dynamodb", "vpc"] as const;
export type AwsService = (typeof IMPLEMENTED_SERVICES)[number];

export const INSTANCE_TYPES = [
  "t3.nano",
  "t3.micro",
  "t3.small",
  "t3.medium",
  "t3.large",
  "t3a.micro",
  "t3a.small",
  "t3a.medium",
  "t2.micro",
  "t2.small",
  "t2.medium",
] as const;

export type PermissionStatus = "ok" | "denied" | "unavailable";

export interface ResourceSummary {
  service: AwsService;
  count: number | null;
  status: PermissionStatus;
  message?: string;
}

export interface ResourceRecord {
  id: string;
  service: AwsService;
  type: string;
  name: string;
  region: string;
  status?: string;
  createdAt?: string;
  metadata: Record<string, string | number | boolean | null>;
}

export interface CostEstimate {
  label: "ESTIMATE";
  currency: "USD";
  hourly: number;
  monthly: number;
  yearly: number;
  breakdown: Array<{ component: string; monthlyUsd: number }>;
  source: "aws-pricing-api" | "unavailable";
  disclaimer: string;
}

export interface BillingSnapshot {
  available: boolean;
  periodStart?: string;
  periodEnd?: string;
  amountUsd?: number;
  todayUsd?: number;
  todayDate?: string;
  currency?: string;
  daily?: Array<{ date: string; amountUsd: number; estimated?: boolean }>;
  message?: string;
}

export interface AdvisorResponse {
  available: boolean;
  recommendations: string[];
  observations: string[];
  disclaimer: string;
  message?: string;
}

export interface OperationRecord {
  operationId: string;
  type: string;
  status: "pending" | "succeeded" | "failed";
  resourceId?: string;
  region: string;
  createdAt: string;
  result?: Record<string, unknown>;
  error?: string;
}

export interface ReportResult {
  reportId: string;
  downloadUrl: string;
  expiresInSeconds: number;
}

export interface EstimateInput {
  service: "ec2";
  region: string;
  instanceType: string;
  operatingSystem: string;
  hoursPerMonth: number;
  volumeType: string;
  volumeSizeGiB: number;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
