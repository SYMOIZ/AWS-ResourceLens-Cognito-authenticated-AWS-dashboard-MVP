from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class SchedulerStatus(BaseModel):
    enabled: bool
    running: bool
    schedule_time: str
    timezone: str
    next_run_at: datetime | None = None
    last_run_at: datetime | None = None
    last_run_status: str | None = None
    last_error: str | None = None


class AppStatus(BaseModel):
    status: str
    app: str
    version: str
    environment: str
    demo_mode: bool
    ai_provider: str
    scheduler: SchedulerStatus
    generation_in_progress: bool
    total_insights: int
    last_successful_generation: datetime | None = None


class PublicSettings(BaseModel):
    ai_provider: str
    scheduler_enabled: bool
    schedule_time: str
    timezone: str
    demo_mode: bool
    app_name: str = "InfraPulse"
    app_version: str = "0.1.0"
    environment: str = "development"


class SettingsUpdate(BaseModel):
    ai_provider: str | None = None
    scheduler_enabled: bool | None = None
    schedule_time: str | None = None
    timezone: str | None = None
    demo_mode: bool | None = None

    @field_validator("ai_provider")
    @classmethod
    def validate_provider(cls, value: str | None) -> str | None:
        if value is None:
            return value
        normalized = value.strip().lower()
        if normalized not in {"demo", "bedrock"}:
            raise ValueError("ai_provider must be 'demo' or 'bedrock'")
        return normalized

    @field_validator("schedule_time")
    @classmethod
    def validate_time(cls, value: str | None) -> str | None:
        if value is None:
            return value
        parts = value.strip().split(":")
        if len(parts) != 2:
            raise ValueError("schedule_time must be HH:MM")
        hour, minute = int(parts[0]), int(parts[1])
        if hour < 0 or hour > 23 or minute < 0 or minute > 59:
            raise ValueError("schedule_time must be a valid 24-hour time")
        return f"{hour:02d}:{minute:02d}"


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str


class SchedulerRunResponse(BaseModel):
    skipped: bool
    reason: str | None = None
    insight_id: int | None = None
    message: str
