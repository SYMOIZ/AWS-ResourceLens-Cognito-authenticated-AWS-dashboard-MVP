export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly publicMessage: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(publicMessage);
    this.name = "AppError";
  }
}

export function permissionError(resource = "this resource"): AppError {
  return new AppError(403, `You don't have permission to view ${resource}.`, "PERMISSION_DENIED");
}

export function billingUnavailable(): AppError {
  return new AppError(
    403,
    "Billing data is unavailable. Please verify Cost Explorer/IAM permissions.",
    "BILLING_UNAVAILABLE",
  );
}

export function timeoutError(): AppError {
  return new AppError(504, "AWS service request timed out. Please try again.", "TIMEOUT");
}

export function creationFailed(detail?: string): AppError {
  return new AppError(
    400,
    detail
      ? `Resource creation failed. ${detail}`
      : "Resource creation failed. Review the AWS error details and IAM permissions.",
    "CREATE_FAILED",
  );
}

export function validationError(message: string): AppError {
  return new AppError(400, message, "VALIDATION_ERROR");
}

export function mapAwsError(error: unknown): AppError {
  const err = error as {
    name?: string;
    Code?: string;
    code?: string;
    message?: string;
    $metadata?: { httpStatusCode?: number };
  };
  const name = err.name ?? err.Code ?? err.code ?? "";
  const status = err.$metadata?.httpStatusCode;

  if (name === "TimeoutError" || name === "TimeoutedError") {
    return timeoutError();
  }
  if (
    name === "AccessDeniedException" ||
    name === "AccessDenied" ||
    name === "UnauthorizedOperation" ||
    name === "UnrecognizedClientException" ||
    status === 403
  ) {
    return permissionError();
  }
  if (name === "AppError") {
    return error as AppError;
  }
  return new AppError(500, "The request could not be completed. Please try again.", "INTERNAL_ERROR");
}

export function isAccessDenied(error: unknown): boolean {
  const err = error as { name?: string; Code?: string; $metadata?: { httpStatusCode?: number } };
  const name = err.name ?? err.Code ?? "";
  return (
    name === "AccessDeniedException" ||
    name === "AccessDenied" ||
    name === "UnauthorizedOperation" ||
    name === "UnrecognizedClientException" ||
    err.$metadata?.httpStatusCode === 403
  );
}
