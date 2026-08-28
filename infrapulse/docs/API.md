# API

All routes are defined in `backend/app/api/routes.py` and served under `/api`. Interactive OpenAPI: `/docs`.

Error body (unless noted):

```json
{
  "error": {
    "code": "not_found",
    "message": "Insight 999999 was not found."
  }
}
```

Validation failures use `"code": "validation_error"` and may include `"details"`.

---

## `GET /api/health`

Liveness. No database required.

**Response 200**

```json
{ "status": "ok", "service": "InfraPulse", "version": "0.1.0" }
```

---

## `GET /api/status`

Operator status for the dashboard ticker.

**Response 200** — `AppStatus`: `status`, `app`, `version`, `environment`, `demo_mode`, `ai_provider`, `scheduler` (enabled, running, schedule_time, timezone, next_run_at, last_run_at, last_run_status, last_error), `generation_in_progress`, `total_insights`, `last_successful_generation`.

If settings `demo_mode` is true, `ai_provider` in this payload is reported as `"demo"`.

---

## `POST /api/insights/generate`

Run the orchestrator immediately. No request body.

**Response 200**

```json
{
  "insight": { "...InsightOut..." },
  "message": "Generated successfully"
}
```

`InsightOut` is the structured insight plus `id`, `generated_at`, `generation_source`.

**Errors**

| Status | code |
| --- | --- |
| 409 | `generation_in_progress` |
| 409 | `conflict` (no enabled topics) |
| 502 | `generation_failed` |

---

## `GET /api/insights/today`

Latest insight whose `generated_at` falls in the current calendar day in the configured timezone.

**Response 200** — `InsightOut` or `null` if none.

---

## `GET /api/insights`

History.

**Query**

| Name | Notes |
| --- | --- |
| `q` | Case-insensitive search on title, summary, topic, category, practical_recommendation |
| `category` | Exact match |
| `topic` | Exact match |
| `limit` | 1–200, default 50 |
| `offset` | default 0 |

**Response 200**

```json
{ "items": [ "InsightOut" ], "total": 2 }
```

Sorted by `generated_at` descending.

---

## `GET /api/insights/{id}`

**Response 200** — `InsightOut`  
**404** — `not_found`

---

## `GET /api/topics`

**Response 200** — array of `{ id, name, category, enabled, last_used_at }` ordered by category, name.

---

## `POST /api/topics`

**Request**

```json
{ "name": "string, min 4", "category": "string, min 2", "enabled": true }
```

**Response 201** — `TopicOut`  
**409** — duplicate name  
**422** — validation

---

## `PATCH /api/topics/{id}`

**Request** (all fields optional): `{ "enabled": false, "name": "...", "category": "..." }`

**Response 200** — `TopicOut`  
**404** — missing id

---

## `GET /api/settings`

Public settings only: `ai_provider`, `scheduler_enabled`, `schedule_time`, `timezone`, `demo_mode`, `app_name`, `app_version`, `environment`.

Does not return AWS keys or `BEDROCK_MODEL_ID`.

---

## `PATCH /api/settings`

**Request** (all optional): `ai_provider` (`demo` \| `bedrock`), `scheduler_enabled`, `schedule_time` (`HH:MM`), `timezone`, `demo_mode`.

**Response 200** — updated `PublicSettings`. Refreshes the APScheduler cron job.

**422** — invalid provider or time.

---

## `POST /api/scheduler/run`

Runs `SchedulerManager.run_daily_job` (same skip-if-today-exists logic as the cron).

**Response 200**

```json
{
  "skipped": true,
  "reason": "today_exists",
  "insight_id": 1,
  "message": "Today's insight already exists. Scheduler will not create a duplicate."
}
```

On success without skip: `skipped` false, `insight_id` set. Failures propagate as 409/502 from generation.
