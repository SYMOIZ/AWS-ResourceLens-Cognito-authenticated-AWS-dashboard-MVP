# Development

## Prerequisites

- Python 3.13+
- Node.js 24+ and npm
- Git
- Optional: Docker Desktop, AWS CLI v2

## Installation

Clone this repository and work from the project root (the directory that contains `backend/` and `frontend/`).

## Backend setup

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
```

On macOS/Linux: `python3 -m venv .venv` and `source .venv/bin/activate`, then `cp .env.example .env`.

## Frontend setup

```powershell
cd frontend
npm install
```

## Environment configuration

See [CONFIGURATION.md](CONFIGURATION.md). Minimum local file `backend/.env`:

```env
DEMO_MODE=true
AI_PROVIDER=demo
DATABASE_URL=sqlite:///./data/infrapulse.db
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Do not copy production Amplify/App Runner origins into git.

## Database setup

No separate migrate command. On startup, `init_db()` runs `Base.metadata.create_all` and `seed_database()` inserts default topics if the table is empty and default settings keys if missing.

Data directory: `backend/data/` (gitignored). Delete `infrapulse.db` to reset.

## Running locally

Terminal 1:

```powershell
cd backend
.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Terminal 2:

```powershell
cd frontend
npm run dev
```

Open http://localhost:5173. The Vite proxy forwards `/api` to the backend.

Useful URLs:

- http://127.0.0.1:8000/api/health
- http://127.0.0.1:8000/docs
- `POST http://127.0.0.1:8000/api/scheduler/run`

Smoke script (backend already running):

```powershell
python scripts/smoke_api.py
```

## Running tests

Backend (from `backend/`, venv active):

```powershell
pytest -q
```

`conftest.py` points `DATABASE_URL` at a temp SQLite file and disables the scheduler.

Frontend:

```powershell
cd frontend
npm test
npm run build
```

`npm run build` runs `tsc --noEmit` then Vite.

## Docker

From repo root:

```powershell
docker compose up --build
```

Backend env is set in `docker-compose.yml` (`DEMO_MODE=true`). Frontend container uses `VITE_PROXY_TARGET=http://backend:8000` so the browser still calls `/api` on port 5173.

## Debugging

- Application logs go to stdout: startup, scheduler register, generation start/success/failure, DB errors.
- `/api/status` shows `scheduler.last_error` and `generation_in_progress`.
- FastAPI 422 bodies include Pydantic `details`.
- If settings in the UI do not match `.env`, check the `settings` SQLite table — it is the runtime source after seed.

## Common errors

| Symptom | Likely cause |
| --- | --- |
| Frontend “Connecting to API…” | Backend not running, wrong `VITE_API_BASE`, or CORS |
| 409 generation_in_progress | Overlapping Generate Now |
| 502 generation_failed | Demo validation bug or Bedrock misconfig |
| 409 no enabled topics | All topics disabled |
| Scheduler not ticking | `SCHEDULER_ENABLED=false` at process start, or settings disabled the job |
| Import errors in pytest | Run from `backend/` so `pytest.ini` `pythonpath = .` applies |
