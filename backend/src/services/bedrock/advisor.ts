import { ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import type { AdvisorResponse, ResourceRecord, ResourceSummary } from "../../types/index.js";
import type { AwsClients } from "../aws/clients.js";
import { isAccessDenied } from "../../utils/errors.js";
import { logError } from "../../utils/logger.js";

const DISCLAIMER =
  "AI recommendations are suggestions. Review AWS configuration and pricing before making infrastructure changes.";

export async function generateAdvice(
  clients: AwsClients,
  payload: {
    region: string;
    summaries: ResourceSummary[];
    resources: ResourceRecord[];
    billingAvailable: boolean;
    currentSpendUsd?: number;
  },
): Promise<AdvisorResponse> {
  const modelId = process.env.BEDROCK_MODEL_ID || "amazon.nova-lite-v1:0";

  const prompt = [
    "You are an AWS infrastructure advisor. Analyze the following structured inventory.",
    "Do not invent resource IDs, billing amounts, or savings figures that are not in the data.",
    "If data is missing or permission-denied, say so. Do not recommend automatic deletion.",
    "Return JSON with keys: recommendations (string[]), observations (string[]).",
    JSON.stringify({
      region: payload.region,
      summaries: payload.summaries,
      sampleResources: payload.resources.slice(0, 40),
      billingAvailable: payload.billingAvailable,
      currentSpendUsd: payload.currentSpendUsd ?? null,
    }),
  ].join("\n");

  try {
    const result = await clients.bedrock.send(
      new ConverseCommand({
        modelId,
        messages: [{ role: "user", content: [{ text: prompt }] }],
        inferenceConfig: { maxTokens: 800, temperature: 0.2 },
      }),
    );

    const text = result.output?.message?.content
      ?.map((c) => ("text" in c ? c.text : ""))
      .join("\n")
      .trim();

    const parsed = parseAdvisorJson(text);
    return {
      available: true,
      recommendations: parsed.recommendations,
      observations: parsed.observations,
      disclaimer: DISCLAIMER,
    };
  } catch (error) {
    logError("Bedrock advisor failed", { message: (error as Error).message });
    if (isAccessDenied(error)) {
      return {
        available: false,
        recommendations: [],
        observations: [],
        disclaimer: DISCLAIMER,
        message:
          "Amazon Bedrock is unavailable. Enable model access for the configured model and verify bedrock:InvokeModel / bedrock:Converse permissions.",
      };
    }
    return {
      available: false,
      recommendations: [],
      observations: [],
      disclaimer: DISCLAIMER,
      message:
        "Amazon Bedrock could not generate recommendations. Confirm the model ID is enabled in this region.",
    };
  }
}

export function parseAdvisorJson(text: string | undefined): {
  recommendations: string[];
  observations: string[];
} {
  if (!text) {
    return { recommendations: [], observations: [] };
  }
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    return { recommendations: [text.slice(0, 1200)], observations: [] };
  }
  try {
    const parsed = JSON.parse(match[0]) as {
      recommendations?: unknown;
      observations?: unknown;
    };
    return {
      recommendations: Array.isArray(parsed.recommendations)
        ? parsed.recommendations.filter((x): x is string => typeof x === "string").slice(0, 12)
        : [],
      observations: Array.isArray(parsed.observations)
        ? parsed.observations.filter((x): x is string => typeof x === "string").slice(0, 12)
        : [],
    };
  } catch {
    return { recommendations: [text.slice(0, 1200)], observations: [] };
  }
}
