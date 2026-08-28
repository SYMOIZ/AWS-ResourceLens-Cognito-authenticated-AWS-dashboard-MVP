import {
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  RunInstancesCommand,
  DescribeImagesCommand,
} from "@aws-sdk/client-ec2";
import { GetParameterCommand } from "@aws-sdk/client-ssm";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "node:crypto";
import type { AwsClients } from "../../services/aws/clients.js";
import type { AuthenticatedUser, Ec2CreateRequest, OperationRecord } from "../../types/index.js";
import { AppError, creationFailed, isAccessDenied } from "../../utils/errors.js";
import { logError, logInfo } from "../../utils/logger.js";

async function resolveAmi(clients: AwsClients): Promise<string> {
  const param = await clients.ssm.send(
    new GetParameterCommand({
      Name: "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64",
    }),
  );
  const ami = param.Parameter?.Value;
  if (!ami) {
    throw creationFailed("Could not resolve the Amazon Linux 2023 AMI from SSM.");
  }
  const images = await clients.ec2.send(new DescribeImagesCommand({ ImageIds: [ami] }));
  if (!images.Images?.[0]?.ImageId) {
    throw creationFailed("Resolved AMI is not available in this region.");
  }
  return ami;
}

async function resolveSubnet(clients: AwsClients): Promise<string> {
  const vpcs = await clients.ec2.send(
    new DescribeVpcsCommand({ Filters: [{ Name: "isDefault", Values: ["true"] }] }),
  );
  const vpcId = vpcs.Vpcs?.[0]?.VpcId;
  if (!vpcId) {
    throw creationFailed("No default VPC found in this region. Create a default VPC before launching EC2.");
  }
  const subnets = await clients.ec2.send(
    new DescribeSubnetsCommand({ Filters: [{ Name: "vpc-id", Values: [vpcId] }] }),
  );
  const subnetId = subnets.Subnets?.[0]?.SubnetId;
  if (!subnetId) {
    throw creationFailed("No subnet found in the default VPC.");
  }
  return subnetId;
}

export async function createEc2Instance(
  clients: AwsClients,
  user: AuthenticatedUser,
  input: Ec2CreateRequest,
): Promise<OperationRecord> {
  if (input.confirm !== true) {
    throw new AppError(400, "Explicit confirmation is required before creating a resource.", "CONFIRM_REQUIRED");
  }

  const operationId = randomUUID();
  const createdAt = new Date().toISOString();
  const table = process.env.OPERATIONS_TABLE;

  const pending: OperationRecord = {
    operationId,
    type: "ec2:RunInstances",
    status: "pending",
    region: input.region,
    createdAt,
  };

  if (table) {
    await clients.appDoc.send(
      new PutCommand({
        TableName: table,
        Item: { pk: `OPERATION#${operationId}`, sk: "META", ...pending, requestedBy: user.sub },
      }),
    );
  }

  try {
    const [imageId, subnetId] = await Promise.all([resolveAmi(clients), resolveSubnet(clients)]);
    logInfo("Creating EC2 instance", {
      operationId,
      region: input.region,
      instanceType: input.instanceType,
      requestedBy: user.sub,
    });

    const result = await clients.ec2.send(
      new RunInstancesCommand({
        ImageId: imageId,
        InstanceType: input.instanceType as never,
        MinCount: 1,
        MaxCount: 1,
        SubnetId: subnetId,
        BlockDeviceMappings: [
          {
            DeviceName: "/dev/xvda",
            Ebs: {
              VolumeSize: input.volumeSizeGiB,
              VolumeType: input.volumeType as never,
              DeleteOnTermination: true,
              Encrypted: true,
            },
          },
        ],
        TagSpecifications: [
          {
            ResourceType: "instance",
            Tags: [
              { Key: "Name", Value: input.name || `resourcelens-${operationId.slice(0, 8)}` },
              { Key: "CreatedBy", Value: "AWS-ResourceLens" },
              { Key: "RequestedBy", Value: user.sub },
            ],
          },
        ],
      }),
    );

    const instanceId = result.Instances?.[0]?.InstanceId;
    const succeeded: OperationRecord = {
      ...pending,
      status: "succeeded",
      resourceId: instanceId,
      result: {
        instanceId,
        imageId,
        subnetId,
        state: result.Instances?.[0]?.State?.Name,
      },
    };

    if (table) {
      await clients.appDoc.send(
        new PutCommand({
          TableName: table,
          Item: { pk: `OPERATION#${operationId}`, sk: "META", ...succeeded, requestedBy: user.sub },
        }),
      );
    }
    return succeeded;
  } catch (error) {
    logError("EC2 creation failed", { operationId, message: (error as Error).message });
    const message = isAccessDenied(error)
      ? "Resource creation failed. Review the AWS error details and IAM permissions."
      : "Resource creation failed. Review the AWS error details and IAM permissions.";
    const failed: OperationRecord = { ...pending, status: "failed", error: message };
    if (table) {
      await clients.appDoc.send(
        new PutCommand({
          TableName: table,
          Item: { pk: `OPERATION#${operationId}`, sk: "META", ...failed, requestedBy: user.sub },
        }),
      );
    }
    throw creationFailed();
  }
}
