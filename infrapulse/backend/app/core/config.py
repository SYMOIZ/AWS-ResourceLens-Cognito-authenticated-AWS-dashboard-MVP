from functools import lru_cache
from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(BACKEND_ROOT / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_env: str = "development"
    app_name: str = "InfraPulse"
    app_version: str = "0.1.0"
    demo_mode: bool = True
    ai_provider: str = "demo"
    database_url: str = "sqlite:///./data/infrapulse.db"
    aws_region: str = "us-east-1"
    bedrock_model_id: str = ""
    scheduler_enabled: bool = True
    schedule_time: str = "09:00"
    timezone: str = "UTC"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    log_level: str = "INFO"

    @field_validator("ai_provider")
    @classmethod
    def normalize_provider(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized not in {"demo", "bedrock"}:
            raise ValueError("AI_PROVIDER must be 'demo' or 'bedrock'")
        return normalized

    @field_validator("schedule_time")
    @classmethod
    def validate_schedule_time(cls, value: str) -> str:
        parts = value.strip().split(":")
        if len(parts) != 2:
            raise ValueError("SCHEDULE_TIME must be HH:MM")
        hour, minute = int(parts[0]), int(parts[1])
        if hour < 0 or hour > 23 or minute < 0 or minute > 59:
            raise ValueError("SCHEDULE_TIME must be a valid 24-hour time")
        return f"{hour:02d}:{minute:02d}"

    @property
    def cors_origin_list(self) -> list[str]:
        return [item.strip() for item in self.cors_origins.split(",") if item.strip()]

    @property
    def sqlite_path(self) -> Path | None:
        if not self.database_url.startswith("sqlite"):
            return None
        raw = self.database_url.split("///", 1)[-1]
        path = Path(raw)
        if not path.is_absolute():
            path = BACKEND_ROOT / path
        return path

    @property
    def effective_ai_provider(self) -> str:
        if self.demo_mode:
            return "demo"
        return self.ai_provider


@lru_cache
def get_settings() -> Settings:
    return Settings()


def reload_settings() -> Settings:
    get_settings.cache_clear()
    return get_settings()
