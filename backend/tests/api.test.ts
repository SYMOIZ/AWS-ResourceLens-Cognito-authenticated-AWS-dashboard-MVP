import { describe, expect, it } from "vitest";
import { computeFromRates, ESTIMATE_DISCLAIMER } from "../src/services/pricing/provider.js";
import { validateEstimate, validateEc2Create, requireRegion, requireService } from "../src/utils/validate.js";
import { parseAdvisorJson } from "../src/services/bedrock/advisor.js";
import { mapAwsError, AppError } from "../src/utils/errors.js";
import { handler } from "../src/handler.js";
import type { APIGatewayProxyEventV2 } from "aws-lambda";

function event(partial: Partial<APIGatewayProxyEventV2> & { path?: string; method?: string }): APIGatewayProxyEventV2 {
  return {
    version: "2.0",
    routeKey: "$default",
    rawPath: partial.rawPath ?? partial.path ?? "/",
    rawQueryString: "",
    headers: {},
    requestContext: {
      accountId: "123",
      apiId: "api",
      domainName: "example.com",
      domainPrefix: "example",
      http: {
        method: partial.method ?? partial.requestContext?.http.method ?? "GET",
        path: partial.rawPath ?? "/",
        protocol: "HTTP/1.1",
        sourceIp: "127.0.0.1",
        userAgent: "test",
      },
      requestId: "req",
      routeKey: "$default",
      stage: "$default",
      time: "",
      timeEpoch: 0,
      authorizer: partial.requestContext?.authorizer ?? {
        jwt: { claims: { sub: "user-1", email: "user@example.com" }, scopes: [] },
      },
    },
    isBase64Encoded: false,
    ...partial,
  } as APIGatewayProxyEventV2;
}

describe("cost calculation", () => {
  it("computes hourly, monthly, and yearly estimates from rates", () => {
    const estimate = computeFromRates(
      {
        service: "ec2",
        region: "us-east-1",
        instanceType: "t3.micro",
        operatingSystem: "Linux",
        hoursPerMonth: 730,
        volumeType: "gp3",
        volumeSizeGiB: 30,
      },
      0.0104,
      0.08,
    );
    expect(estimate.label).toBe("ESTIMATE");
    expect(estimate.monthly).toBe(9.99);
    expect(estimate.yearly).toBe(119.88);
    expect(estimate.disclaimer).toBe(ESTIMATE_DISCLAIMER);
  });

  it("includes storage in the monthly total", () => {
    const estimate = computeFromRates(
      {
        service: "ec2",
        region: "us-east-1",
        instanceType: "t3.small",
        operatingSystem: "Linux",
        hoursPerMonth: 100,
        volumeType: "gp3",
        volumeSizeGiB: 100,
      },
      0.02,
      0.1,
    );
    expect(estimate.breakdown[0]?.monthlyUsd).toBe(2);
    expect(estimate.breakdown[1]?.monthlyUsd).toBe(10);
    expect(estimate.monthly).toBe(12);
  });
});

describe("input validation", () => {
  it("rejects unknown regions", () => {
    expect(() => requireRegion("us-fake-1")).toThrow(AppError);
  });

  it("rejects unimplemented services", () => {
    expect(() => requireService("eks")).toThrow(/Implemented/);
  });

  it("rejects hours outside 1-744", () => {
    expect(() =>
      validateEstimate({
        service: "ec2",
        region: "us-east-1",
        instanceType: "t3.micro",
        operatingSystem: "Linux",
        hoursPerMonth: 800,
        volumeType: "gp3",
        volumeSizeGiB: 8,
      }),
    ).toThrow(/Hours per month/);
  });

  it("requires explicit confirmation for EC2 creation", () => {
    expect(() =>
      validateEc2Create({
        region: "us-east-1",
        instanceType: "t3.micro",
        volumeType: "gp3",
        volumeSizeGiB: 8,
        confirm: false,
      }),
    ).toThrow(/confirmation/);
  });

  it("rejects large instance types that are not allow-listed", () => {
    expect(() =>
      validateEc2Create({
        region: "us-east-1",
        instanceType: "p4d.24xlarge",
        volumeType: "gp3",
        volumeSizeGiB: 8,
        confirm: true,
      }),
    ).toThrow(/instance type/);
  });

  it("accepts a valid create payload", () => {
    const body = validateEc2Create({
      region: "us-east-1",
      instanceType: "t3.micro",
      volumeType: "gp3",
      volumeSizeGiB: 20,
      confirm: true,
      name: "demo",
    });
    expect(body.confirm).toBe(true);
    expect(body.volumeSizeGiB).toBe(20);
  });
});

describe("IAM permission errors", () => {
  it("maps AccessDenied to a user-safe permission message", () => {
    const mapped = mapAwsError({ name: "AccessDeniedException", $metadata: { httpStatusCode: 403 } });
    expect(mapped.statusCode).toBe(403);
    expect(mapped.publicMessage).toContain("permission");
    expect(mapped.publicMessage).not.toContain("stack");
  });

  it("maps timeouts without leaking internals", () => {
    const mapped = mapAwsError({ name: "TimeoutError" });
    expect(mapped.statusCode).toBe(504);
    expect(mapped.publicMessage).toContain("timed out");
  });
});

describe("advisor parsing", () => {
  it("extracts JSON recommendations from model text", () => {
    const parsed = parseAdvisorJson('Here you go\n{"recommendations":["rightsize t3"],"observations":["1 stopped instance"]}');
    expect(parsed.recommendations).toEqual(["rightsize t3"]);
    expect(parsed.observations).toEqual(["1 stopped instance"]);
  });
});

describe("API handlers", () => {
  it("health is unauthenticated", async () => {
    const res = await handler(
      event({
        method: "GET",
        rawPath: "/health",
        requestContext: {
          accountId: "1",
          apiId: "a",
          domainName: "x",
          domainPrefix: "x",
          http: { method: "GET", path: "/health", protocol: "HTTP/1.1", sourceIp: "1", userAgent: "t" },
          requestId: "r",
          routeKey: "$default",
          stage: "$default",
          time: "",
          timeEpoch: 0,
        },
      } as never),
    );
    const body = JSON.parse((res as { body: string }).body);
    expect((res as { statusCode: number }).statusCode).toBe(200);
    expect(body.status).toBe("ok");
  });

  it("rejects missing JWT on protected routes", async () => {
    const res = await handler(
      event({
        method: "GET",
        rawPath: "/resources",
        requestContext: {
          accountId: "1",
          apiId: "a",
          domainName: "x",
          domainPrefix: "x",
          http: { method: "GET", path: "/resources", protocol: "HTTP/1.1", sourceIp: "1", userAgent: "t" },
          requestId: "r",
          routeKey: "$default",
          stage: "$default",
          time: "",
          timeEpoch: 0,
        },
      } as never),
    );
    expect((res as { statusCode: number }).statusCode).toBe(401);
  });

  it("validates region on list resources", async () => {
    const res = await handler(
      event({
        method: "GET",
        rawPath: "/resources",
        queryStringParameters: { region: "not-a-region" },
      }),
    );
    expect((res as { statusCode: number }).statusCode).toBe(400);
    const body = JSON.parse((res as { body: string }).body);
    expect(body.code).toBe("VALIDATION_ERROR");
  });

  it("does not create resources without confirm: true", async () => {
    const res = await handler(
      event({
        method: "POST",
        rawPath: "/resources/ec2",
        body: JSON.stringify({
          region: "us-east-1",
          instanceType: "t3.micro",
          volumeType: "gp3",
          volumeSizeGiB: 8,
          confirm: false,
        }),
      }),
    );
    expect((res as { statusCode: number }).statusCode).toBe(400);
    expect(JSON.parse((res as { body: string }).body).error).toMatch(/confirmation/i);
  });

  it("returns 404 for unknown routes", async () => {
    const res = await handler(event({ method: "GET", rawPath: "/nope" }));
    expect((res as { statusCode: number }).statusCode).toBe(404);
  });
});
