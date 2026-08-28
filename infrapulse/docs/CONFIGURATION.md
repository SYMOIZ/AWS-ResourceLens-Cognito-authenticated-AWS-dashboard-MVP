# Configuration

Values come from process environment and optional `backend/.env` (`pydantic-settings`). Environment variables override the file. After first boot, `ai_provider`, `demo_mode`, `scheduler_enabled`, `schedule_time`, and `timezone` are also stored in SQLite `settings` and used by generation and the scheduler job refresh.

Never put access keys in these variables if an IAM role is available.

## Backend (`backend/app/core/config.py`)

| Name | Purpose | Required | Example |
| --- | --- | --- | --- |
| `APP_ENV` | Label in `/api/status` and settings (`environment`) | Optional (default `development`) | `development` |
| `DEMO_MODE` | If true, factory always uses `DemoProvider` (also seeded into settings) | Optional (default `true`) | `true` |
| `AI_PROVIDER` | `demo` or `bedrock` (seed + factory when demo is off) | Optional (default `demo`) | `demo` |
| `DATABASE_URL` | SQLAlchemy URL | Optional | `sqlite:///./data/infrapulse.db` |
| `AWS_REGION` | Region for `boto3` Bedrock client | Optional (default `us-east-1`) | `us-east-1` |
| `BEDROCK_MODEL_ID` | Bedrock model id for `converse` | Required only if using Bedrock | empty locally |
| `SCHEDULER_ENABLED` | Start APScheduler on process boot | Optional (default `true`) | `true` |
| `SCHEDULE_TIME` | Default daily `HH:MM` (24h) | Optional (default `09:00`) | `09:00` |
| `TIMEZONE` | Default IANA timezone for cron and “today” | Optional (default `UTC`) | `UTC` |
| `CORS_ORIGINS` | Comma-separated browser origins | Optional | `http://localhost:5173,http://127.0.0.1:5173` |
| `LOG_LEVEL` | Logging level | Optional (default `INFO`) | `INFO` |

`APP_NAME` / `APP_VERSION` exist as settings fields with defaults `InfraPulse` / `0.1.0`; they are not typically set in `.env.example`.

Docker Compose and App Runner use `DATABASE_URL=sqlite:////app/data/infrapulse.db` (absolute path in the container).

## Frontend

| Name | Purpose | Required | Example |
| --- | --- | --- | --- |
| `VITE_API_BASE` | Origin prefix for `fetch` (no trailing slash). Empty = same origin `/api` | Optional | empty locally; `https://BACKEND_HOST` for a static Amplify build |
| `VITE_PROXY_TARGET` | Dev-server proxy target for `/api` (Vite config, not baked into production JS) | Optional | `http://127.0.0.1:8000` or `http://backend:8000` in Compose |

## AWS credentials

Not application settings. `BedrockProvider` uses the default boto3 chain (environment, shared config, instance/task role). Do not commit keys. Do not put secrets in `VITE_*` variables.
