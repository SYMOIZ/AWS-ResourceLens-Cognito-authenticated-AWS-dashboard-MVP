import {
  ALLOWED_INSTANCE_TYPES,
  ALLOWED_OS,
  ALLOWED_REGIONS,
  ALLOWED_VOLUME_TYPES,
  IMPLEMENTED_SERVICES,
  type AwsRegion,
  type AwsService,
  type EstimateRequest,
  type Ec2CreateRequest,
} from "../types/index.js";
import { validationError } from "./errors.js";

export function isRegion(value: string | undefined): value is AwsRegion {
  return !!value && (ALLOWED_REGIONS as readonly string[]).includes(value);
}

export function isService(value: string | undefined): value is AwsService {
  return !!value && (IMPLEMENTED_SERVICES as readonly string[]).includes(value);
}

export function requireRegion(value: string | undefined): AwsRegion {
  if (!isRegion(value)) {
    throw validationError(
      `Invalid or missing AWS region. Allowed: ${ALLOWED_REGIONS.join(", ")}.`,
    );
  }
  return value;
}

export function requireService(value: string | undefined): AwsService {
  if (!isService(value)) {
    throw validationError(
      `Invalid or missing service. Implemented: ${IMPLEMENTED_SERVICES.join(", ")}.`,
    );
  }
  return value;
}

export function parseJsonBody<T>(body: string | undefined | null): T {
  if (!body) {
    throw validationError("Request body is required.");
  }
  try {
    return JSON.parse(body) as T;
  } catch {
    throw validationError("Request body must be valid JSON.");
  }
}

export function validateEstimate(input: Partial<EstimateRequest>): EstimateRequest {
  const region = requireRegion(input.region);
  if (input.service !== "ec2") {
    throw validationError("Cost estimation currently supports EC2 only.");
  }
  if (!input.instanceType || !(ALLOWED_INSTANCE_TYPES as readonly string[]).includes(input.instanceType)) {
    throw validationError(
      `Invalid instance type. Allowed: ${ALLOWED_INSTANCE_TYPES.join(", ")}.`,
    );
  }
  if (!input.operatingSystem || !(ALLOWED_OS as readonly string[]).includes(input.operatingSystem)) {
    throw validationError("Operating system must be Linux or Windows.");
  }
  const hours = Number(input.hoursPerMonth);
  if (!Number.isFinite(hours) || hours < 1 || hours > 744) {
    throw validationError("Hours per month must be between 1 and 744.");
  }
  if (!input.volumeType || !(ALLOWED_VOLUME_TYPES as readonly string[]).includes(input.volumeType)) {
    throw validationError("Volume type must be gp3 or gp2.");
  }
  const size = Number(input.volumeSizeGiB);
  if (!Number.isInteger(size) || size < 8 || size > 1000) {
    throw validationError("Storage size must be an integer between 8 and 1000 GiB.");
  }
  return {
    service: "ec2",
    region,
    instanceType: input.instanceType,
    operatingSystem: input.operatingSystem,
    hoursPerMonth: hours,
    volumeType: input.volumeType,
    volumeSizeGiB: size,
  };
}

export function validateEc2Create(input: Partial<Ec2CreateRequest>): Ec2CreateRequest {
  const region = requireRegion(input.region);
  if (!input.instanceType || !(ALLOWED_INSTANCE_TYPES as readonly string[]).includes(input.instanceType)) {
    throw validationError(
      `Invalid instance type. Allowed: ${ALLOWED_INSTANCE_TYPES.join(", ")}.`,
    );
  }
  if (!input.volumeType || !(ALLOWED_VOLUME_TYPES as readonly string[]).includes(input.volumeType)) {
    throw validationError("Volume type must be gp3 or gp2.");
  }
  const size = Number(input.volumeSizeGiB);
  if (!Number.isInteger(size) || size < 8 || size > 1000) {
    throw validationError("Storage size must be an integer between 8 and 1000 GiB.");
  }
  if (input.confirm !== true) {
    throw validationError("Explicit confirmation is required. Set confirm: true after reviewing the estimate.");
  }
  const name = input.name?.trim();
  if (name && (name.length > 64 || !/^[\w .+=:@/-]+$/.test(name))) {
    throw validationError("Name tag contains invalid characters or is too long.");
  }
  return {
    region,
    instanceType: input.instanceType,
    volumeType: input.volumeType,
    volumeSizeGiB: size,
    confirm: true,
    name: name || undefined,
  };
}

export function sanitizeId(id: string): string {
  if (!id || id.length > 256 || /[\s<>]/.test(id)) {
    throw validationError("Invalid resource identifier.");
  }
  return id;
}
