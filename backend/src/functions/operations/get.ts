import { GetCommand } from "@aws-sdk/lib-dynamodb";
import type { AwsClients } from "../../services/aws/clients.js";
import type { OperationRecord } from "../../types/index.js";
import { AppError } from "../../utils/errors.js";

export async function getOperation(clients: AwsClients, operationId: string): Promise<OperationRecord> {
  const table = process.env.OPERATIONS_TABLE;
  if (!table) {
    throw new AppError(500, "Operations store is not configured.", "CONFIG");
  }
  const item = await clients.appDoc.send(
    new GetCommand({ TableName: table, Key: { pk: `OPERATION#${operationId}`, sk: "META" } }),
  );
  if (!item.Item) {
    throw new AppError(404, "Operation not found.", "NOT_FOUND");
  }
  return {
    operationId: String(item.Item.operationId),
    type: String(item.Item.type),
    status: item.Item.status as OperationRecord["status"],
    resourceId: item.Item.resourceId as string | undefined,
    region: String(item.Item.region),
    createdAt: String(item.Item.createdAt),
    result: item.Item.result as Record<string, unknown> | undefined,
    error: item.Item.error as string | undefined,
  };
}
