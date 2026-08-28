#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { ResourceLensStack } from "../lib/resourcelens-stack";

const app = new cdk.App();
new ResourceLensStack(app, "AwsResourceLensStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || "us-east-1",
  },
  description: "AWS ResourceLens — Analyze, Estimate & Manage AWS Resources",
});
