# AWS migration

This file distinguishes three things: the **local application**, an **optional container hosting path**, and a **serverless target** that is not implemented as the running architecture.

## CURRENT LOCAL ARCHITECTURE (implemented)

```text
APScheduler → FastAPI generation_service → AIProvider (demo or Bedrock) → SQLite
React (Vite) → GET/POST /api
```

This is what `uvicorn` and `npm run dev` run. SQLite is durable on the developer disk. Demo mode needs no AWS account.

## OPTIONAL AWS HOSTING (same application, different runtime)

The FastAPI process can be built as the existing `backend/Dockerfile` image, pushed to Amazon ECR, and run on **AWS App Runner**. The Vite production build can be uploaded to **Amplify Hosting**.

That path still uses:

- APScheduler inside the container
- SQLite on the container filesystem (**ephemeral** — data is lost if the instance is replaced)
- `DEMO_MODE=true` unless you change environment variables
- CORS set to the Amplify origin
- `VITE_API_BASE` baked into the frontend at build time

IAM: App Runner **ECR access role** (`build.apprunner.amazonaws.com`) and optional **instance role** (`tasks.apprunner.amazonaws.com`). No access keys in the image. Commands: [AWS_DEPLOYMENT.md](AWS_DEPLOYMENT.md).

This is **not** EventBridge, Lambda, DynamoDB, or S3-backed insights.

## TARGET AWS ARCHITECTURE (designed, not the current runtime)

```text
Amazon EventBridge Scheduler
        ↓
AWS Lambda (same orchestrator as generation_service)
        ↓
Amazon Bedrock (BedrockProvider)
        ↓
DynamoDB (insights / topics / settings) + optional S3
        ↓
Static web frontend
```

| Local module | Intended replacement |
| --- | --- |
| APScheduler | EventBridge Scheduler |
| FastAPI process for the daily job | Lambda handler calling `run_scheduled_generation` |
| SQLite | DynamoDB (+ optional S3 for long fields) |
| DemoProvider | BedrockProvider with IAM invoke permission |
| Vite dev server | Amplify Hosting, CloudFront+S3, or equivalent |

`BedrockProvider` already exists (`boto3.client("bedrock-runtime").converse`). It is unused while `DEMO_MODE=true`.

### Bedrock (when you turn demo off)

```env
DEMO_MODE=false
AI_PROVIDER=bedrock
AWS_REGION=us-east-1
BEDROCK_MODEL_ID=<model id your account can invoke>
```

Use the credential chain / task role. Do not commit keys.

### Persistence (not implemented)

- DynamoDB tables for insights, topics, settings
- Optional S3 objects if item size is a concern
- Keep Pydantic `InfrastructureInsight` as the canonical record

### Scheduler (not implemented)

Point EventBridge at a function that calls the same skip-if-today-exists + generate path.

## Out of scope for the local MVP

This repository does not include CloudFormation/SAM/CDK for EventBridge, Lambda, DynamoDB, or S3. Do not assume those resources exist because this file describes them.
