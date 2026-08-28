import logging

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.catalog import DEFAULT_TOPICS, SETTING_DEFAULTS
from app.models import Setting, Topic

logger = logging.getLogger(__name__)


def seed_database(db: Session) -> None:
    settings = get_settings()
    existing_topics = {name for (name,) in db.execute(select(Topic.name)).all()}
    created = 0
    for item in DEFAULT_TOPICS:
        if item["name"] in existing_topics:
            continue
        db.add(Topic(name=item["name"], category=item["category"], enabled=True))
        created += 1

    env_defaults = {
        "ai_provider": settings.ai_provider,
        "scheduler_enabled": str(settings.scheduler_enabled).lower(),
        "schedule_time": settings.schedule_time,
        "timezone": settings.timezone,
        "demo_mode": str(settings.demo_mode).lower(),
    }
    for key, value in {**SETTING_DEFAULTS, **env_defaults}.items():
        current = db.get(Setting, key)
        if current is None:
            db.add(Setting(key=key, value=value))

    db.commit()
    if created:
        logger.info("Seeded %s infrastructure topics", created)
