from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models import Setting
from app.schemas.status import PublicSettings, SettingsUpdate

BOOL_KEYS = {"scheduler_enabled", "demo_mode"}
ALLOWED_KEYS = {"ai_provider", "scheduler_enabled", "schedule_time", "timezone", "demo_mode"}


def _as_bool(value: str) -> bool:
    return value.strip().lower() in {"1", "true", "yes", "on"}


def get_setting_map(db: Session) -> dict[str, str]:
    rows = db.scalars(select(Setting)).all()
    return {row.key: row.value for row in rows}


def get_public_settings(db: Session) -> PublicSettings:
    env = get_settings()
    stored = get_setting_map(db)
    return PublicSettings(
        ai_provider=stored.get("ai_provider", env.ai_provider),
        scheduler_enabled=_as_bool(stored.get("scheduler_enabled", str(env.scheduler_enabled))),
        schedule_time=stored.get("schedule_time", env.schedule_time),
        timezone=stored.get("timezone", env.timezone),
        demo_mode=_as_bool(stored.get("demo_mode", str(env.demo_mode))),
        app_name=env.app_name,
        app_version=env.app_version,
        environment=env.app_env,
    )


def update_settings(db: Session, patch: SettingsUpdate) -> PublicSettings:
    payload = patch.model_dump(exclude_none=True)
    for key, value in payload.items():
        if key not in ALLOWED_KEYS:
            continue
        stored = str(value).lower() if key in BOOL_KEYS or key == "ai_provider" else str(value)
        if key in BOOL_KEYS:
            stored = "true" if bool(value) else "false"
        row = db.get(Setting, key)
        if row is None:
            db.add(Setting(key=key, value=stored))
        else:
            row.value = stored
    db.commit()
    return get_public_settings(db)
