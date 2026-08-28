import { execFileSync, execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const AWS =
  process.platform === "win32"
    ? "C:\\Program Files\\Amazon\\AWSCLIV2\\aws.exe"
    : "aws";
const REGION = process.env.AWS_REGION || process.env.CDK_DEFAULT_REGION || "us-east-1";
const STACK = "AwsResourceLensStack";

function aws(args) {
  return execFileSync(AWS, args, { encoding: "utf8" });
}

function awsJson(args) {
  return JSON.parse(aws(args));
}

console.log("Using AWS CLI:", AWS);
console.log(aws(["sts", "get-caller-identity"]));

execSync("npx cdk bootstrap", {
  cwd: join(root, "infra"),
  stdio: "inherit",
  env: { ...process.env, AWS_REGION: REGION, CDK_DEFAULT_REGION: REGION },
  shell: process.platform === "win32",
});

execSync("npx cdk deploy --require-approval never", {
  cwd: join(root, "infra"),
  stdio: "inherit",
  env: { ...process.env, AWS_REGION: REGION, CDK_DEFAULT_REGION: REGION },
  shell: process.platform === "win32",
});

const stacks = awsJson([
  "cloudformation",
  "describe-stacks",
  "--stack-name",
  STACK,
  "--region",
  REGION,
]);
const outputs = Object.fromEntries(
  (stacks.Stacks[0].Outputs || []).map((o) => [o.OutputKey, o.OutputValue]),
);

const env = [
  `VITE_AWS_REGION=${outputs.Region || REGION}`,
  `VITE_COGNITO_USER_POOL_ID=${outputs.UserPoolId}`,
  `VITE_COGNITO_CLIENT_ID=${outputs.UserPoolClientId}`,
  `VITE_API_URL=${outputs.CloudFrontUrl}/api`,
  "VITE_USE_MOCK=false",
].join("\n");

const frontendDir = join(root, "frontend");
writeFileSync(join(frontendDir, ".env.production"), env + "\n");
console.log("Wrote frontend/.env.production");

execSync("npm run build", { cwd: frontendDir, stdio: "inherit", shell: process.platform === "win32" });

const bucket = outputs.FrontendBucketName;
const dist = join(frontendDir, "dist");
aws(["s3", "sync", dist, `s3://${bucket}`, "--delete", "--region", REGION]);
console.log("Synced frontend to", bucket);

aws([
  "cloudfront",
  "create-invalidation",
  "--distribution-id",
  outputs.CloudFrontDistributionId,
  "--paths",
  "/*",
  "--region",
  REGION,
]);

console.log("\nDeployed AWS ResourceLens");
console.log("App URL:", outputs.CloudFrontUrl);
console.log("API URL:", outputs.ApiUrl);
