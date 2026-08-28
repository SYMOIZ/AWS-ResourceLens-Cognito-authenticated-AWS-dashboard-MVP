# InfraPulse — Always-On Infrastructure Agent

InfraPulse is an autonomous infrastructure-learning agent. It selects an infrastructure topic, generates a **structured** engineering insight, stores it, and shows it on an operations-style dashboard. A scheduler can produce one insight per day without a manual click.

This repository is a local-first MVP designed so the same generation pipeline can later move to Amazon EventBridge, AWS Lambda, Amazon Bedrock, DynamoDB, and S3. An optional container hosting path (Amplify Hosting + App Runner) is documented separately and still runs this FastAPI + SQLite application.

## Problem statement

Infrastructure engineers collect useful patterns from AWS, Azure, Kubernetes, Terraform, and operations practice, but that knowledge is usually scattered across chats, runbooks, and one-off notes. InfraPulse turns that into a daily, structured artifact: a real-world scenario, a technical explanation, architecture notes, practices, mistakes, and a concrete next action.

## Vision

An always-on agent that:

1. Picks a topic from a configurable catalog (avoiding recent duplicates).
2. Generates a validated `InfrastructureInsight` (never raw unstructured model text as the primary record).
3. Persists the insight and displays it with history.

It is not a generic chatbot. Manual **Generate Now** exists for operators; the default loop is scheduled.

## Features

- Daily automatic generation via APScheduler (`09:00` UTC by default, configurable)
- Manual generation from the dashboard
- Structured insight schema enforced with Pydantic
- Topic catalog with enable/disable and least-recently-used selection
- Demo mode: deterministic local catalog, no network AI calls
- Amazon Bedrock provider behind the same `AIProvider` interface (not required for local use)
- SQLite persistence (`insights`, `topics`, `settings`)
- React dashboard: Dashboard, Today's Insight, History, Topics, Settings
- REST API with typed errors and OpenAPI at `/docs`

## Screenshots

Add captures under [`screenshots/`](screenshots/README.md) (`dashboard.png`, `today.png`, `history.png`, `topics.png`, `settings.png`) and embed them here, for example:

```markdown
![Dashboard](screenshots/dashboard.png)
```

## Architecture

**Current local implementation:**

```text
Browser (React + Vite)
        |
        |  /api  (Vite proxy in development, or VITE_API_BASE)
        v
FastAPI
  REST routes → generation_service / topic_service / settings_service
        |
        +--> APScheduler (cron job `daily_insight`)
        |
        v
AIProvider
  DemoProvider  (on-disk catalog, default when DEMO_MODE=true)
  BedrockProvider (boto3 bedrock-runtime converse)
        |
        v
SQLite  (insights, topics, settings)
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for component diagrams and data flow.

**Target AWS architecture** (not the default local stack; Bedrock/DynamoDB/EventBridge are not required to run this repo):

```text
EventBridge → Lambda → Bedrock → DynamoDB / S3 → web UI
```

An optional **hosting** path keeps this same FastAPI process and SQLite file, packaged as a container on App Runner with a static UI on Amplify Hosting. That is documented in [docs/AWS_DEPLOYMENT.md](docs/AWS_DEPLOYMENT.md). SQLite on App Runner is ephemeral.

## Technology stack

| Layer | Implementation |
| --- | --- |
| Frontend | React 19, TypeScript, Vite 7, React Router 7 |
| Backend | Python 3.13, FastAPI, Pydantic v2, SQLAlchemy 2 |
| Database | SQLite |
| Scheduler | APScheduler `AsyncIOScheduler` + `CronTrigger` |
| AI | `AIProvider` ABC; `DemoProvider`; `BedrockProvider` (boto3) |
| Local containers | Docker Compose (optional) |

## Project structure

```text
infrapulse/
├── backend/                 FastAPI app, tests, Dockerfile
│   ├── app/
│   │   ├── api/routes.py    REST API
│   │   ├── ai/              AIProvider, demo catalog, Bedrock
│   │   ├── scheduler/       APScheduler manager
│   │   ├── services/        generation, topics, settings, insights
│   │   ├── models/          SQLAlchemy entities
│   │   ├── schemas/         Pydantic models
│   │   └── core/            config, logging, errors
│   └── tests/
├── frontend/                Vite + React UI
├── docs/                    Architecture, API, AWS, development
├── infra/                   IAM trust policies, App Runner template
├── scripts/smoke_api.py
├── docker-compose.yml
└── .env.example
```

## Local setup

### Prerequisites

- Python 3.13+
- Node.js 24+ and npm
- Optional: Docker, AWS CLI (only for AWS hosting or Bedrock)

### Environment variables

Copy [`.env.example`](.env.example) to `backend/.env`. Never commit `.env`.

Full reference: [docs/CONFIGURATION.md](docs/CONFIGURATION.md).

Safe local defaults:

```env
APP_ENV=development
DEMO_MODE=true
AI_PROVIDER=demo
DATABASE_URL=sqlite:///./data/infrapulse.db
SCHEDULER_ENABLED=true
SCHEDULE_TIME=09:00
TIMEZONE=UTC
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

`VITE_API_BASE` is a frontend build-time variable. Leave it empty for local Vite (requests go to `/api` and are proxied to port 8000).

### Running the backend

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

- API: http://127.0.0.1:8000
- Health: http://127.0.0.1:8000/api/health
- OpenAPI: http://127.0.0.1:8000/docs

SQLite is created at `backend/data/infrapulse.db` on startup. Topics and default settings are seeded if missing.

### Running the frontend

```powershell
cd frontend
npm install
npm run dev
```

UI: http://localhost:5173

### Docker setup

```powershell
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend: http://localhost:8000

Native Python + Node is the primary local workflow. Docker is optional.

## API documentation

Routes live in `backend/app/api/routes.py` and are mounted at `/api`. See [docs/API.md](docs/API.md) for request/response shapes.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Liveness |
| GET | `/api/status` | Scheduler, provider, insight counts |
| POST | `/api/insights/generate` | Manual generation |
| GET | `/api/insights/today` | Latest insight for the configured timezone's current day |
| GET | `/api/insights` | History (search, category, topic, pagination) |
| GET | `/api/insights/{id}` | Single insight |
| GET | `/api/topics` | Topic catalog |
| POST | `/api/topics` | Create topic |
| PATCH | `/api/topics/{id}` | Update topic (enable/disable) |
| GET | `/api/settings` | Public settings (no secrets) |
| PATCH | `/api/settings` | Update schedule/provider/demo flags |
| POST | `/api/scheduler/run` | Run the same job as the daily cron immediately |

## Scheduler behavior

`SchedulerManager` (`backend/app/scheduler/manager.py`) starts with the FastAPI lifespan when `SCHEDULER_ENABLED` is true (environment). The cron time and timezone also live in the `settings` table and can be changed from the UI.

On each tick (`run_daily_job`):

1. If an insight already exists for today in `TIMEZONE`, skip (`reason=today_exists`).
2. Otherwise run the same orchestrator as **Generate Now**.
3. Record last run status in memory for `/api/status`.

Manual generation always creates a new row (latest of the day becomes “today”) but shares an asyncio lock so two generations cannot run at once (`409 generation_in_progress`).

Trigger the scheduler without waiting a day:

```powershell
curl -X POST http://127.0.0.1:8000/api/scheduler/run
```

Or **Settings → Run scheduled job now**.

## Demo mode

When `DEMO_MODE=true` (environment) or `demo_mode` is true in the settings table, `get_ai_provider` returns `DemoProvider`. That provider selects from `backend/app/ai/demo_catalog.py` and does not call the network.

If demo mode is off and `AI_PROVIDER=bedrock`, `BedrockProvider` uses the AWS credential provider chain and `BEDROCK_MODEL_ID`. No access keys belong in the UI or in git.

## AI provider architecture

```text
generation_service._generate
        → get_ai_provider(demo_mode, ai_provider)
                → DemoProvider.generate
                → BedrockProvider.generate
        → InfrastructureInsight.model_validate
        → persist_insight + mark_topic_used (one commit)
```

Orchestration never imports boto3. Failed generation rolls back the session.

## Testing

```powershell
cd backend
.venv\Scripts\Activate.ps1
pytest -q

cd ..\frontend
npm test
npm run build
```

Backend tests cover health, status, demo provider validation, topic selection, generate/today/history, scheduler duplicate-day skip, and API 422/404 behavior.

## Troubleshooting

**Frontend loads with empty data**  
Start the backend. Confirm http://127.0.0.1:8000/api/health. For a production static build, `VITE_API_BASE` must be set at build time to the backend origin.

**Generate Now: generation already running**  
Wait for the in-flight request. The API returns HTTP 409.

**Bedrock errors**  
Demo mode is the supported zero-config path. Bedrock needs `DEMO_MODE=false`, a model id, AWS credentials or an instance role, and model access in the account.

**CORS errors from a hosted UI**  
Set `CORS_ORIGINS` to the exact frontend origin (comma-separated). FastAPI enables credentials, so `*` is not used.

**SQLite missing / locked**  
The process must be able to create `backend/data/`. Do not commit that directory.

## AWS migration / deployment architecture

Three layers — do not conflate them:

| Layer | What it is | Status in this repo |
| --- | --- | --- |
| Local MVP | FastAPI + APScheduler + SQLite + Demo/Bedrock providers | Implemented and tested |
| Optional hosting | Same app in ECR → App Runner; Vite `dist` → Amplify Hosting | Process documented in [docs/AWS_DEPLOYMENT.md](docs/AWS_DEPLOYMENT.md) |
| Serverless target | EventBridge → Lambda → Bedrock → DynamoDB/S3 | Designed, not implemented as the runtime |

Details: [docs/AWS_MIGRATION.md](docs/AWS_MIGRATION.md).

## Security considerations

- Do not commit `.env`, keys, or account-specific ARNs
- Bedrock uses the default AWS credential chain; prefer IAM roles
- AI output is stored as data and never executed
- Logs redact messages that look like they contain secret key names
- Settings API does not expose AWS keys or `BEDROCK_MODEL_ID`

See [SECURITY.md](SECURITY.md).

## Future roadmap

- Persist insights in DynamoDB (and optional S3 for long text)
- Replace APScheduler with EventBridge Scheduler + Lambda
- Enable Bedrock as the default production provider
- Budget alarms on Bedrock and compute
- Optional publish-to-Slack
- Durable storage when hosting on App Runner (SQLite is ephemeral there)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT. See [LICENSE](LICENSE).
