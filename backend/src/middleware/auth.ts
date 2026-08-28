import type { APIGatewayProxyEventV2 } from "aws-lambda";
import type { AuthenticatedUser } from "../types/index.js";
import { AppError } from "../utils/errors.js";

export function getUser(event: APIGatewayProxyEventV2): AuthenticatedUser {
  const claims = event.requestContext.authorizer?.jwt?.claims;
  if (!claims?.sub) {
    throw new AppError(401, "Authentication required.", "UNAUTHENTICATED");
  }
  return {
    sub: String(claims.sub),
    email: claims.email ? String(claims.email) : undefined,
    username: claims["cognito:username"] ? String(claims["cognito:username"]) : undefined,
  };
}
