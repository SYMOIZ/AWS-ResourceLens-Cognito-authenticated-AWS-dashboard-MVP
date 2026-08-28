import {
  DescribeInstancesCommand,
  DescribeVpcsCommand,
} from "@aws-sdk/client-ec2";
import { ListBucketsCommand, GetBucketLocationCommand } from "@aws-sdk/client-s3";
import { ListFunctionsCommand } from "@aws-sdk/client-lambda";
import { DescribeDBInstancesCommand } from "@aws-sdk/client-rds";
import { ListTablesCommand, DescribeTableCommand } from "@aws-sdk/client-dynamodb";
import type { AwsClients } from "../../services/aws/clients.js";
import type {
  AwsService,
  PermissionStatus,
  ResourceRecord,
  ResourceSummary,
  ServiceResult,
} from "../../types/index.js";
import { isAccessDenied } from "../../utils/errors.js";
import { logError } from "../../utils/logger.js";

function denied<T>(message: string): ServiceResult<T> {
  return { status: "denied", message };
}

function ok<T>(data: T): ServiceResult<T> {
  return { status: "ok", data };
}

function catchService<T>(error: unknown, label: string): ServiceResult<T> {
  logError(`${label} discovery failed`, { message: (error as Error).message });
  if (isAccessDenied(error)) {
    return denied(`You don't have permission to view ${label} resources.`);
  }
  return { status: "unavailable", message: `${label} data is unavailable. Please try again.` };
}

export async function listEc2(clients: AwsClients, region: string): Promise<ServiceResult<ResourceRecord[]>> {
  try {
    const items: ResourceRecord[] = [];
    let nextToken: string | undefined;
    do {
      const page = await clients.ec2.send(new DescribeInstancesCommand({ NextToken: nextToken }));
      for (const reservation of page.Reservations ?? []) {
        for (const instance of reservation.Instances ?? []) {
          const name = instance.Tags?.find((t) => t.Key === "Name")?.Value;
          items.push({
            id: instance.InstanceId ?? "unknown",
            service: "ec2",
            type: "EC2 Instance",
            name: name || instance.InstanceId || "unnamed",
            region,
            status: instance.State?.Name,
            createdAt: instance.LaunchTime?.toISOString(),
            metadata: {
              instanceType: instance.InstanceType ?? "",
              availabilityZone: instance.Placement?.AvailabilityZone ?? "",
              privateIp: instance.PrivateIpAddress ?? "",
              publicIp: instance.PublicIpAddress ?? "",
              vpcId: instance.VpcId ?? "",
              subnetId: instance.SubnetId ?? "",
              platform: instance.PlatformDetails ?? instance.Platform ?? "Linux/UNIX",
              architecture: instance.Architecture ?? "",
            },
          });
        }
      }
      nextToken = page.NextToken;
    } while (nextToken);
    return ok(items);
  } catch (error) {
    return catchService(error, "EC2");
  }
}

export async function listS3(clients: AwsClients, region: string): Promise<ServiceResult<ResourceRecord[]>> {
  try {
    const listed = await clients.s3.send(new ListBucketsCommand({}));
    const items: ResourceRecord[] = [];
    for (const bucket of listed.Buckets ?? []) {
      if (!bucket.Name) continue;
      let bucketRegion = "us-east-1";
      try {
        const loc = await clients.s3.send(new GetBucketLocationCommand({ Bucket: bucket.Name }));
        bucketRegion = loc.LocationConstraint || "us-east-1";
      } catch {
        bucketRegion = "unknown";
      }
      if (bucketRegion !== region && bucketRegion !== "unknown") continue;
      items.push({
        id: bucket.Name,
        service: "s3",
        type: "S3 Bucket",
        name: bucket.Name,
        region: bucketRegion,
        status: "available",
        createdAt: bucket.CreationDate?.toISOString(),
        metadata: {
          creationDate: bucket.CreationDate?.toISOString() ?? "",
        },
      });
    }
    return ok(items);
  } catch (error) {
    return catchService(error, "S3");
  }
}

export async function listLambda(clients: AwsClients, region: string): Promise<ServiceResult<ResourceRecord[]>> {
  try {
    const items: ResourceRecord[] = [];
    let marker: string | undefined;
    do {
      const page = await clients.lambda.send(new ListFunctionsCommand({ Marker: marker }));
      for (const fn of page.Functions ?? []) {
        items.push({
          id: fn.FunctionName ?? fn.FunctionArn ?? "unknown",
          service: "lambda",
          type: "Lambda Function",
          name: fn.FunctionName ?? "unnamed",
          region,
          status: fn.State ?? "Active",
          createdAt: fn.LastModified,
          metadata: {
            runtime: fn.Runtime ?? "",
            memory: fn.MemorySize ?? 0,
            timeout: fn.Timeout ?? 0,
            lastModified: fn.LastModified ?? "",
            packageType: fn.PackageType ?? "",
            arn: fn.FunctionArn ?? "",
          },
        });
      }
      marker = page.NextMarker;
    } while (marker);
    return ok(items);
  } catch (error) {
    return catchService(error, "Lambda");
  }
}

export async function listRds(clients: AwsClients, region: string): Promise<ServiceResult<ResourceRecord[]>> {
  try {
    const page = await clients.rds.send(new DescribeDBInstancesCommand({}));
    const items: ResourceRecord[] = (page.DBInstances ?? []).map((db) => ({
      id: db.DBInstanceIdentifier ?? "unknown",
      service: "rds" as const,
      type: "RDS Instance",
      name: db.DBInstanceIdentifier ?? "unnamed",
      region,
      status: db.DBInstanceStatus,
      createdAt: db.InstanceCreateTime?.toISOString(),
      metadata: {
        engine: db.Engine ?? "",
        engineVersion: db.EngineVersion ?? "",
        instanceClass: db.DBInstanceClass ?? "",
        multiAz: db.MultiAZ ?? false,
        storageType: db.StorageType ?? "",
        allocatedStorage: db.AllocatedStorage ?? 0,
      },
    }));
    return ok(items);
  } catch (error) {
    return catchService(error, "RDS");
  }
}

export async function listDynamo(clients: AwsClients, region: string): Promise<ServiceResult<ResourceRecord[]>> {
  try {
    const names: string[] = [];
    let last: string | undefined;
    do {
      const page = await clients.dynamodb.send(new ListTablesCommand({ ExclusiveStartTableName: last }));
      names.push(...(page.TableNames ?? []));
      last = page.LastEvaluatedTableName;
    } while (last);

    const items: ResourceRecord[] = [];
    for (const name of names) {
      try {
        const desc = await clients.dynamodb.send(new DescribeTableCommand({ TableName: name }));
        const table = desc.Table;
        items.push({
          id: name,
          service: "dynamodb",
          type: "DynamoDB Table",
          name,
          region,
          status: table?.TableStatus,
          createdAt: table?.CreationDateTime?.toISOString(),
          metadata: {
            billingMode: table?.BillingModeSummary?.BillingMode ?? "PROVISIONED",
            itemCount: table?.ItemCount ?? 0,
            tableSizeBytes: table?.TableSizeBytes ?? 0,
            arn: table?.TableArn ?? "",
          },
        });
      } catch (error) {
        if (isAccessDenied(error)) {
          items.push({
            id: name,
            service: "dynamodb",
            type: "DynamoDB Table",
            name,
            region,
            status: "unknown",
            metadata: { note: "DescribeTable permission missing" },
          });
        }
      }
    }
    return ok(items);
  } catch (error) {
    return catchService(error, "DynamoDB");
  }
}

export async function listVpc(clients: AwsClients, region: string): Promise<ServiceResult<ResourceRecord[]>> {
  try {
    const page = await clients.ec2.send(new DescribeVpcsCommand({}));
    const items: ResourceRecord[] = (page.Vpcs ?? []).map((vpc) => {
      const name = vpc.Tags?.find((t) => t.Key === "Name")?.Value;
      return {
        id: vpc.VpcId ?? "unknown",
        service: "vpc" as const,
        type: "VPC",
        name: name || vpc.VpcId || "unnamed",
        region,
        status: vpc.State,
        metadata: {
          cidr: vpc.CidrBlock ?? "",
          isDefault: vpc.IsDefault ?? false,
          dhcpOptionsId: vpc.DhcpOptionsId ?? "",
        },
      };
    });
    return ok(items);
  } catch (error) {
    return catchService(error, "VPC");
  }
}

const listers: Record<AwsService, (c: AwsClients, r: string) => Promise<ServiceResult<ResourceRecord[]>>> = {
  ec2: listEc2,
  s3: listS3,
  lambda: listLambda,
  rds: listRds,
  dynamodb: listDynamo,
  vpc: listVpc,
};

export async function listResources(
  clients: AwsClients,
  region: string,
  service?: AwsService,
): Promise<{ resources: ResourceRecord[]; services: Record<AwsService, ServiceResult<ResourceRecord[]>> }> {
  const selected = service ? [service] : (Object.keys(listers) as AwsService[]);
  const services = {} as Record<AwsService, ServiceResult<ResourceRecord[]>>;
  const resources: ResourceRecord[] = [];

  await Promise.all(
    selected.map(async (svc) => {
      const result = await listers[svc](clients, region);
      services[svc] = result;
      if (result.status === "ok" && result.data) {
        resources.push(...result.data);
      }
    }),
  );

  return { resources, services };
}

export async function summarize(
  clients: AwsClients,
  region: string,
): Promise<ResourceSummary[]> {
  const { services } = await listResources(clients, region);
  return (Object.keys(listers) as AwsService[]).map((service) => {
    const result = services[service];
    const status: PermissionStatus = result?.status ?? "unavailable";
    return {
      service,
      count: result?.status === "ok" ? result.data?.length ?? 0 : null,
      status,
      message: result?.message,
    };
  });
}
