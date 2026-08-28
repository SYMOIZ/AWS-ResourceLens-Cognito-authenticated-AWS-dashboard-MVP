# AWS deployment (optional hosting)

These commands package the **existing FastAPI + SQLite app** and the **Vite static UI**. They create AWS resources. They do **not** provision EventBridge, Lambda, DynamoDB, or Bedrock model access.

Replace placeholders:

- `ACCOUNT_ID` — 12-digit account
- `AWS_REGION` — e.g. `us-east-1`
- `AMPLIFY_APP_ID` — from `create-app`
- `BACKEND_URL` — App Runner `ServiceUrl` with `https://`
- `CORS` — exact Amplify origin, e.g. `https://main.AMPLIFY_APP_ID.amplifyapp.com`

Do not commit real account IDs, URLs, or credentials.

## Prerequisites

- AWS CLI authenticated in the target region
- Docker (to build and push the backend image)
- IAM permission for ECR, IAM roles, App Runner, Amplify
- Node/npm to build the frontend

## 1. IAM roles (creates IAM resources)

Trust documents are in `infra/apprunner-ecr-trust.json` and `infra/apprunner-instance-trust.json`.

```bash
aws iam create-role \
  --role-name infrapulse-apprunner-ecr-access \
  --assume-role-policy-document file://infra/apprunner-ecr-trust.json

aws iam attach-role-policy \
  --role-name infrapulse-apprunner-ecr-access \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess

aws iam create-role \
  --role-name infrapulse-apprunner-instance \
  --assume-role-policy-document file://infra/apprunner-instance-trust.json
```

Wait a short time before App Runner assumes a newly created role.

## 2. ECR (creates a repository)

```bash
aws ecr create-repository --repository-name infrapulse-backend --region AWS_REGION
```

Build and push (**local Docker**, remote registry):

```bash
aws ecr get-login-password --region AWS_REGION \
  | docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.AWS_REGION.amazonaws.com

docker build -t infrapulse-backend:latest backend
docker tag infrapulse-backend:latest ACCOUNT_ID.dkr.ecr.AWS_REGION.amazonaws.com/infrapulse-backend:latest
docker push ACCOUNT_ID.dkr.ecr.AWS_REGION.amazonaws.com/infrapulse-backend:latest
```

## 3. App Runner (creates compute)

Edit `infra/apprunner-service.json`: substitute `ACCOUNT_ID`, region, CORS origin, and after the first autoscaling config exists, its ARN.

Create a min-size-1 scaling config (cost control):

```bash
aws apprunner create-auto-scaling-configuration \
  --auto-scaling-configuration-name infrapulse-min \
  --min-size 1 --max-size 1 --max-concurrency 100 \
  --region AWS_REGION
```

```bash
aws apprunner create-service --cli-input-json file://infra/apprunner-service.json --region AWS_REGION
```

Environment variables in that file should include `DEMO_MODE=true` unless Bedrock is fully configured. Health check path is `/api/health`, port `8000`.

Poll until `Status` is `RUNNING`, then:

```bash
curl https://BACKEND_URL/api/health
```

## 4. Amplify Hosting (creates an app)

```bash
aws amplify create-app --name infrapulse --platform WEB --region AWS_REGION
aws amplify update-app --app-id AMPLIFY_APP_ID --custom-rules file://infra/amplify-redirects.json --region AWS_REGION
aws amplify create-branch --app-id AMPLIFY_APP_ID --branch-name main --stage PRODUCTION --no-enable-auto-build --region AWS_REGION
```

SPA fallback rules are in `infra/amplify-redirects.json`.

Set CORS on App Runner to `https://main.AMPLIFY_APP_ID.amplifyapp.com` (update the service configuration if the app was created after the backend).

Build the UI **with the public backend origin**:

```bash
cd frontend
set VITE_API_BASE=https://BACKEND_URL
npm ci
npm run build
```

Zip `frontend/dist` so files sit at the zip root (not a parent folder). Then (**creates a deployment job**):

```bash
aws amplify create-deployment --app-id AMPLIFY_APP_ID --branch-name main --region AWS_REGION
# PUT the zip to zipUploadUrl from the response (presigned; do not log it)
aws amplify start-deployment --app-id AMPLIFY_APP_ID --branch-name main --job-id JOB_ID --region AWS_REGION
```

Production UI: `https://main.AMPLIFY_APP_ID.amplifyapp.com`

## 5. Verify

```bash
curl https://BACKEND_URL/api/health
curl -X POST https://BACKEND_URL/api/insights/generate
curl -H "Origin: https://main.AMPLIFY_APP_ID.amplifyapp.com" -D - https://BACKEND_URL/api/health
```

In the browser: Dashboard, Today's Insight, History, Topics, Settings, Generate Now.

## Notes

- App Runner SQLite is not a durable production database.
- Lowest practical size used in the template: `0.25 vCPU` / `0.5 GB`, autoscaling max 1.
- Do not attach AdministratorAccess. The ECR pull policy is the managed App Runner ECR policy; the instance role can stay empty until Bedrock is enabled.
- Destroying these resources is out of scope for this document; use the matching `delete-service` / `delete-app` / `delete-repository` commands only when you intend to tear down InfraPulse hosting.
