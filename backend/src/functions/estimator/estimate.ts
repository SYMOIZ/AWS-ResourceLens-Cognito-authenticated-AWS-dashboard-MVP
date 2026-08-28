import type { AwsClients } from "../../services/aws/clients.js";
import type { CostEstimate, EstimateRequest } from "../../types/index.js";
import { AwsPricingProvider } from "../../services/pricing/provider.js";

export async function estimateCost(
  clients: AwsClients,
  input: EstimateRequest,
): Promise<{ estimate: CostEstimate; cheaperOptions: CostEstimate[] }> {
  const provider = new AwsPricingProvider(clients);
  const estimate = await provider.estimateEc2(input);
  const cheaperOptions =
    estimate.source === "aws-pricing-api" ? await provider.compareCheaper(input) : [];
  return { estimate, cheaperOptions };
}
