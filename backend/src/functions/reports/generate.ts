import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "node:crypto";
import type { AwsClients } from "../../services/aws/clients.js";
import type {
  AdvisorResponse,
  BillingSnapshot,
  CostEstimate,
  ReportResult,
  ResourceRecord,
  ResourceSummary,
} from "../../types/index.js";
import { AppError } from "../../utils/errors.js";

export async function generateReport(
  clients: AwsClients,
  input: {
    region: string;
    requestedBy: string;
    summaries: ResourceSummary[];
    resources: ResourceRecord[];
    billing: BillingSnapshot;
    plannedEstimate?: CostEstimate | null;
    advisor?: AdvisorResponse | null;
  },
): Promise<ReportResult> {
  const bucket = process.env.REPORTS_BUCKET;
  if (!bucket) {
    throw new AppError(500, "Report storage is not configured.", "CONFIG");
  }

  const reportId = randomUUID();
  const createdAt = new Date().toISOString();
  const body = {
    title: "AWS ResourceLens Report",
    generatedAt: createdAt,
    region: input.region,
    requestedBy: input.requestedBy,
    resourceCounts: input.summaries,
    resources: input.resources.map((r) => ({
      id: r.id,
      service: r.service,
      type: r.type,
      name: r.name,
      region: r.region,
      status: r.status,
    })),
    costInformation: input.billing.available
      ? {
          currentSpendUsd: input.billing.amountUsd,
          periodStart: input.billing.periodStart,
          periodEnd: input.billing.periodEnd,
        }
      : { message: input.billing.message },
    plannedResourceEstimate: input.plannedEstimate?.source === "aws-pricing-api" ? input.plannedEstimate : null,
    optimizationRecommendations: input.advisor?.available ? input.advisor.recommendations : [],
    disclaimer:
      "This report contains estimates and inventory snapshots. It is not an official AWS invoice.",
  };

  const html = renderHtml(body);
  const key = `reports/${input.requestedBy}/${reportId}.html`;

  await clients.appS3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: html,
      ContentType: "text/html; charset=utf-8",
      ServerSideEncryption: "AES256",
    }),
  );

  const table = process.env.OPERATIONS_TABLE;
  if (table) {
    await clients.appDoc.send(
      new PutCommand({
        TableName: table,
        Item: {
          pk: `REPORT#${reportId}`,
          sk: "META",
          reportId,
          key,
          region: input.region,
          createdAt,
          requestedBy: input.requestedBy,
        },
      }),
    );
  }

  const downloadUrl = await getSignedUrl(
    clients.appS3,
    new GetObjectCommand({ Bucket: bucket, Key: key }),
    { expiresIn: 900 },
  );

  return { reportId, downloadUrl, expiresInSeconds: 900 };
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderHtml(body: Record<string, unknown>): string {
  const counts = body.resourceCounts as ResourceSummary[];
  const resources = body.resources as Array<Record<string, unknown>>;
  const recs = (body.optimizationRecommendations as string[]) ?? [];
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>AWS ResourceLens Report</title>
  <style>
    body { font-family: Georgia, serif; color: #12202e; margin: 48px; }
    h1 { font-family: "Trebuchet MS", sans-serif; letter-spacing: .04em; }
    table { border-collapse: collapse; width: 100%; margin: 16px 0 32px; }
    th, td { border: 1px solid #c9d4df; padding: 8px 10px; text-align: left; font-size: 14px; }
    th { background: #eef4f8; }
    .meta { color: #4a6274; }
    .disclaimer { margin-top: 40px; font-size: 13px; color: #5b6f7e; }
  </style>
</head>
<body>
  <h1>AWS ResourceLens Report</h1>
  <p class="meta">Generated ${escapeHtml(body.generatedAt)} · Region ${escapeHtml(body.region)}</p>
  <h2>Resource counts</h2>
  <table>
    <tr><th>Service</th><th>Count</th><th>Status</th></tr>
    ${counts
      .map(
        (c) =>
          `<tr><td>${escapeHtml(c.service)}</td><td>${c.count ?? "—"}</td><td>${escapeHtml(c.status)}${
            c.message ? ` — ${escapeHtml(c.message)}` : ""
          }</td></tr>`,
      )
      .join("")}
  </table>
  <h2>Cost information</h2>
  <pre>${escapeHtml(JSON.stringify(body.costInformation, null, 2))}</pre>
  <h2>Planned resource estimate</h2>
  <pre>${escapeHtml(JSON.stringify(body.plannedResourceEstimate, null, 2))}</pre>
  <h2>Inventory</h2>
  <table>
    <tr><th>Service</th><th>Type</th><th>Name / ID</th><th>Status</th></tr>
    ${resources
      .map(
        (r) =>
          `<tr><td>${escapeHtml(r.service)}</td><td>${escapeHtml(r.type)}</td><td>${escapeHtml(r.name)} (${escapeHtml(r.id)})</td><td>${escapeHtml(r.status)}</td></tr>`,
      )
      .join("")}
  </table>
  <h2>Optimization recommendations</h2>
  <ul>${recs.map((r) => `<li>${escapeHtml(r)}</li>`).join("") || "<li>None available</li>"}</ul>
  <p class="disclaimer">${escapeHtml(body.disclaimer)}</p>
</body>
</html>`;
}
