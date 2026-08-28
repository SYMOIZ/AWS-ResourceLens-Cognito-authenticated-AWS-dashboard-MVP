import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

const READ_INSTANCE_TYPES = [
  "t3.nano",
  "t3.micro",
  "t3.small",
  "t3.medium",
  "t3.large",
  "t3a.micro",
  "t3a.small",
  "t3a.medium",
  "t2.micro",
  "t2.small",
  "t2.medium",
];

export function grantResourceLensPermissions(scope: Construct, role: iam.IRole, props: {
  operationsTableArn: string;
  reportsBucketArn: string;
  bedrockModelId: string;
  account: string;
  region: string;
}): void {
  role.addToPrincipalPolicy(
    new iam.PolicyStatement({
      sid: "ReadInventory",
      actions: [
        "ec2:DescribeInstances",
        "ec2:DescribeVpcs",
        "ec2:DescribeSubnets",
        "ec2:DescribeImages",
        "s3:ListAllMyBuckets",
        "s3:GetBucketLocation",
        "lambda:ListFunctions",
        "rds:DescribeDBInstances",
        "dynamodb:ListTables",
        "dynamodb:DescribeTable",
      ],
      resources: ["*"],
    }),
  );

  role.addToPrincipalPolicy(
    new iam.PolicyStatement({
      sid: "CostExplorerRead",
      actions: ["ce:GetCostAndUsage"],
      resources: ["*"],
    }),
  );

  role.addToPrincipalPolicy(
    new iam.PolicyStatement({
      sid: "PriceListRead",
      actions: ["pricing:GetProducts"],
      resources: ["*"],
    }),
  );

  role.addToPrincipalPolicy(
    new iam.PolicyStatement({
      sid: "ResolveAmazonLinuxAmi",
      actions: ["ssm:GetParameter"],
      resources: [
        `arn:aws:ssm:${props.region}::parameter/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64`,
        `arn:aws:ssm:${props.region}:${props.account}:parameter/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64`,
      ],
    }),
  );

  role.addToPrincipalPolicy(
    new iam.PolicyStatement({
      sid: "CreateSmallEc2Only",
      actions: ["ec2:RunInstances"],
      resources: [
        `arn:aws:ec2:${props.region}:${props.account}:instance/*`,
        `arn:aws:ec2:${props.region}:${props.account}:volume/*`,
        `arn:aws:ec2:${props.region}:${props.account}:network-interface/*`,
        `arn:aws:ec2:${props.region}:${props.account}:security-group/*`,
        `arn:aws:ec2:${props.region}:${props.account}:subnet/*`,
        `arn:aws:ec2:${props.region}::image/*`,
      ],
      conditions: {
        StringEquals: {
          "ec2:InstanceType": READ_INSTANCE_TYPES,
        },
      },
    }),
  );

  role.addToPrincipalPolicy(
    new iam.PolicyStatement({
      sid: "TagCreatedInstances",
      actions: ["ec2:CreateTags"],
      resources: [
        `arn:aws:ec2:${props.region}:${props.account}:instance/*`,
        `arn:aws:ec2:${props.region}:${props.account}:volume/*`,
      ],
      conditions: {
        StringEquals: {
          "ec2:CreateAction": "RunInstances",
        },
      },
    }),
  );

  role.addToPrincipalPolicy(
    new iam.PolicyStatement({
      sid: "AppDataPlane",
      actions: [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:Query",
        "dynamodb:UpdateItem",
      ],
      resources: [props.operationsTableArn],
    }),
  );

  role.addToPrincipalPolicy(
    new iam.PolicyStatement({
      sid: "ReportsBucket",
      actions: ["s3:PutObject", "s3:GetObject"],
      resources: [`${props.reportsBucketArn}/*`],
    }),
  );

  role.addToPrincipalPolicy(
    new iam.PolicyStatement({
      sid: "BedrockAdvisor",
      actions: ["bedrock:InvokeModel", "bedrock:InvokeModelWithResponseStream"],
      resources: [
        `arn:aws:bedrock:${props.region}::foundation-model/${props.bedrockModelId}`,
        `arn:aws:bedrock:${props.region}:${props.account}:inference-profile/*`,
        `arn:aws:bedrock:*::foundation-model/${props.bedrockModelId}`,
      ],
    }),
  );

  role.addToPrincipalPolicy(
    new iam.PolicyStatement({
      sid: "OptionalAssumeRole",
      actions: ["sts:AssumeRole"],
      resources: [`arn:aws:iam::*:role/ResourceLensTargetRole`],
    }),
  );
}

export { READ_INSTANCE_TYPES };
