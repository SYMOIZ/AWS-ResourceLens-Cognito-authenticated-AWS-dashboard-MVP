import type { AwsClients } from "../../services/aws/clients.js";
import { generateAdvice } from "../../services/bedrock/advisor.js";
import { listResources, summarize } from "../resources/list.js";
import { getBilling } from "../billing/get.js";

export async function advise(clients: AwsClients, region: string) {
  const [{ resources }, summaries, billing] = await Promise.all([
    listResources(clients, region),
    summarize(clients, region),
    getBilling(clients),
  ]);

  return generateAdvice(clients, {
    region,
    summaries,
    resources,
    billingAvailable: billing.available,
    currentSpendUsd: billing.amountUsd,
  });
}
