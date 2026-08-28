import type { APIGatewayProxyEventV2, APIGatewayProxyHandlerV2 } from "aws-lambda";
import { createAwsClients } from "./services/aws/clients.js";
import { getUser } from "./middleware/auth.js";
import { handleError, json, ok, created } from "./utils/response.js";
import {
  parseJsonBody,
  requireRegion,
  requireService,
  sanitizeId,
  validateEc2Create,
  validateEstimate,
} from "./utils/validate.js";
import { listResources, summarize } from "./functions/resources/list.js";
import { getResource } from "./functions/resources/get.js";
import { getBilling } from "./functions/billing/get.js";
import { estimateCost } from "./functions/estimator/estimate.js";
import { createEc2Instance } from "./functions/resource-creator/create-ec2.js";
import { advise } from "./functions/advisor/advise.js";
import { generateReport } from "./functions/reports/generate.js";
import { getOperation } from "./functions/operations/get.js";
import { logInfo } from "./utils/logger.js";
import type { EstimateRequest } from "./types/index.js";
import { AppError } from "./utils/errors.js";

function pathOf(event: APIGatewayProxyEventV2): string {
  return (event.rawPath || "/").replace(/\/$/, "") || "/";
}

function query(event: APIGatewayProxyEventV2, key: string): string | undefined {
  return event.queryStringParameters?.[key];
}

function bodyRegion(event: APIGatewayProxyEventV2): string | undefined {
  if (!event.body) return undefined;
  try {
    return (JSON.parse(event.body) as { region?: string }).region;
  } catch {
    return undefined;
  }
}

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    if (event.requestContext.http.method === "OPTIONS") {
      return json(204, {});
    }

    const method = event.requestContext.http.method;
    const path = pathOf(event);
    logInfo("request", { method, path });

    if (method === "GET" && path === "/health") {
      return ok({ status: "ok", service: "aws-resourcelens" });
    }

    const user = getUser(event);

    if (method === "GET" && path === "/resources/summary") {
      const region = requireRegion(query(event, "region"));
      const clients = await createAwsClients(region);
      return ok({ region, summaries: await summarize(clients, region) });
    }

    if (method === "GET" && path === "/resources") {
      const region = requireRegion(query(event, "region"));
      const serviceParam = query(event, "service");
      const service = serviceParam ? requireService(serviceParam) : undefined;
      const search = (query(event, "q") ?? "").toLowerCase();
      const clients = await createAwsClients(region);
      const { resources, services } = await listResources(clients, region, service);
      const filtered = search
        ? resources.filter(
            (r) =>
              r.id.toLowerCase().includes(search) ||
              r.name.toLowerCase().includes(search) ||
              r.type.toLowerCase().includes(search),
          )
        : resources;
      return ok({ region, resources: filtered, services });
    }

    const resourceMatch = path.match(/^\/resources\/([^/]+)$/);
    if (method === "GET" && resourceMatch?.[1]) {
      const region = requireRegion(query(event, "region"));
      const service = requireService(query(event, "service"));
      const clients = await createAwsClients(region);
      const resource = await getResource(
        clients,
        region,
        service,
        sanitizeId(decodeURIComponent(resourceMatch[1])),
      );
      return ok({ resource });
    }

    if (method === "GET" && path === "/billing") {
      const region = requireRegion(query(event, "region") ?? process.env.APP_REGION ?? "us-east-1");
      const clients = await createAwsClients(region);
      return ok({ billing: await getBilling(clients) });
    }

    if (method === "POST" && path === "/estimate") {
      const body = validateEstimate(parseJsonBody(event.body));
      const { estimate, cheaperOptions } = await estimateCost(await createAwsClients(body.region), body);
      return ok({ estimate, cheaperOptions });
    }

    if (method === "POST" && path === "/resources/ec2") {
      const body = validateEc2Create(parseJsonBody(event.body));
      const operation = await createEc2Instance(await createAwsClients(body.region), user, body);
      return created({ operation });
    }

    if (method === "POST" && path === "/advisor") {
      const payload = parseJsonBody<{ region?: string }>(event.body ?? "{}");
      const targetRegion = requireRegion(payload.region ?? query(event, "region"));
      const advice = await advise(await createAwsClients(targetRegion), targetRegion);
      return ok({ advisor: advice });
    }

    if (method === "POST" && path === "/reports") {
      const payload = parseJsonBody<{ region?: string; plannedEstimate?: EstimateRequest }>(event.body ?? "{}");
      const targetRegion = requireRegion(payload.region ?? query(event, "region") ?? bodyRegion(event));
      const reportClients = await createAwsClients(targetRegion);
      const [{ resources }, summaries, billing] = await Promise.all([
        listResources(reportClients, targetRegion),
        summarize(reportClients, targetRegion),
        getBilling(reportClients),
      ]);
      let plannedEstimate = null;
      if (payload.plannedEstimate) {
        plannedEstimate = (await estimateCost(reportClients, validateEstimate(payload.plannedEstimate))).estimate;
      }
      const report = await generateReport(reportClients, {
        region: targetRegion,
        requestedBy: user.sub,
        summaries,
        resources,
        billing,
        plannedEstimate,
      });
      return created({ report });
    }

    const opMatch = path.match(/^\/operations\/([^/]+)$/);
    if (method === "GET" && opMatch?.[1]) {
      const region = requireRegion(query(event, "region") ?? process.env.APP_REGION ?? "us-east-1");
      const operation = await getOperation(await createAwsClients(region), sanitizeId(opMatch[1]));
      return ok({ operation });
    }

    throw new AppError(404, "Route not found.", "NOT_FOUND");
  } catch (error) {
    return handleError(error);
  }
};
