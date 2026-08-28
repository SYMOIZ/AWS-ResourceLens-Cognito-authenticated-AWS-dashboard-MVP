import type { APIGatewayProxyResultV2 } from "aws-lambda";
import { AppError } from "./errors.js";
import { logError } from "./logger.js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Authorization,Content-Type",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Content-Type": "application/json",
};

export function json(statusCode: number, body: unknown): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(body),
  };
}

export function ok(body: unknown): APIGatewayProxyResultV2 {
  return json(200, body);
}

export function created(body: unknown): APIGatewayProxyResultV2 {
  return json(201, body);
}

export function handleError(error: unknown): APIGatewayProxyResultV2 {
  if (error instanceof AppError) {
    logError(error.publicMessage, { code: error.code, details: error.details });
    return json(error.statusCode, {
      error: error.publicMessage,
      code: error.code,
    });
  }

  logError("Unhandled error", {
    name: (error as Error)?.name,
    message: (error as Error)?.message,
  });

  return json(500, {
    error: "The request could not be completed. Please try again.",
    code: "INTERNAL_ERROR",
  });
}
