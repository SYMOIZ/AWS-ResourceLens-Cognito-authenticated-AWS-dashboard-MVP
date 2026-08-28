import type { AwsClients } from "../../services/aws/clients.js";
import type { AwsService, ResourceRecord } from "../../types/index.js";
import { listResources } from "./list.js";
import { validationError } from "../../utils/errors.js";

export async function getResource(
  clients: AwsClients,
  region: string,
  service: AwsService,
  id: string,
): Promise<ResourceRecord> {
  const { resources, services } = await listResources(clients, region, service);
  const found = resources.find((r) => r.id === id);
  if (found) return found;

  const svc = services[service];
  if (svc?.status === "denied") {
    throw validationError(svc.message ?? "You don't have permission to view this resource.");
  }
  throw validationError("Resource not found in the selected region.");
}
