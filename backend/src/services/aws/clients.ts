import { EC2Client } from "@aws-sdk/client-ec2";
import { S3Client } from "@aws-sdk/client-s3";
import { LambdaClient } from "@aws-sdk/client-lambda";
import { RDSClient } from "@aws-sdk/client-rds";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { CostExplorerClient } from "@aws-sdk/client-cost-explorer";
import { PricingClient } from "@aws-sdk/client-pricing";
import { SSMClient } from "@aws-sdk/client-ssm";
import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { assumeRoleService } from "../sts/assume-role.js";

export interface AwsClients {
  ec2: EC2Client;
  s3: S3Client;
  lambda: LambdaClient;
  rds: RDSClient;
  dynamodb: DynamoDBClient;
  doc: DynamoDBDocumentClient;
  costExplorer: CostExplorerClient;
  pricing: PricingClient;
  ssm: SSMClient;
  bedrock: BedrockRuntimeClient;
  appS3: S3Client;
  appDoc: DynamoDBDocumentClient;
}

async function credentialConfig(): Promise<{ credentials?: Awaited<ReturnType<typeof assumeRoleService.getCredentials>> }> {
  const credentials = await assumeRoleService.getCredentials();
  return credentials ? { credentials } : {};
}

export async function createAwsClients(region: string): Promise<AwsClients> {
  const creds = await credentialConfig();
  const appRegion = process.env.APP_REGION || process.env.AWS_REGION || "us-east-1";

  const ec2 = new EC2Client({ region, ...creds });
  const s3 = new S3Client({ region, ...creds });
  const lambda = new LambdaClient({ region, ...creds });
  const rds = new RDSClient({ region, ...creds });
  const dynamodb = new DynamoDBClient({ region, ...creds });
  const costExplorer = new CostExplorerClient({ region: "us-east-1", ...creds });
  const pricing = new PricingClient({ region: "us-east-1", ...creds });
  const ssm = new SSMClient({ region, ...creds });
  const bedrock = new BedrockRuntimeClient({ region: appRegion, ...creds });

  // App-owned resources always stay in the application account (never assumed).
  const appDdb = new DynamoDBClient({ region: appRegion });
  const appS3 = new S3Client({ region: appRegion });

  return {
    ec2,
    s3,
    lambda,
    rds,
    dynamodb,
    doc: DynamoDBDocumentClient.from(dynamodb, {
      marshallOptions: { removeUndefinedValues: true },
    }),
    costExplorer,
    pricing,
    ssm,
    bedrock,
    appS3,
    appDoc: DynamoDBDocumentClient.from(appDdb, {
      marshallOptions: { removeUndefinedValues: true },
    }),
  };
}
