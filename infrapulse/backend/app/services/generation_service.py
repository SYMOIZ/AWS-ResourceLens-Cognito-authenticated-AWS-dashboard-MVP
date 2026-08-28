import asyncio
import logging
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ai.factory import get_ai_provider
from app.core.exceptions import GenerationFailedError, GenerationInProgressError
from app.models import Insight
from app.schemas.insight import InsightOut
from app.services.insight_service import (
    get_today_insight,
    insight_to_out,
    persist_insight,
)
from app.services.settings_service import get_public_settings
from app.services.topic_service import mark_topic_used, select_next_topic

logger = logging.getLogger(__name__)

_generation_lock = asyncio.Lock()
_in_progress = False


def generation_in_progress() -> bool:
    return _in_progress


async def generate_insight(db: Session, *, trigger: str = "manual") -> InsightOut:
    global _in_progress
    if _generation_lock.locked():
        raise GenerationInProgressError()

    async with _generation_lock:
        _in_progress = True
        try:
            return await _generate(db, trigger)
        finally:
            _in_progress = False


async def run_scheduled_generation(db: Session) -> dict:
    existing = get_today_insight(db)
    if existing is not None:
        logger.info("Scheduled generation skipped; today's insight already exists id=%s", existing.id)
        return {
            "skipped": True,
            "reason": "today_exists",
            "insight_id": existing.id,
            "message": "Today's insight already exists. Scheduler will not create a duplicate.",
        }
    insight = await generate_insight(db, trigger="scheduler")
    return {
        "skipped": False,
        "reason": None,
        "insight_id": insight.id,
        "message": "Scheduled generation completed.",
    }


async def _generate(db: Session, trigger: str) -> InsightOut:
    settings = get_public_settings(db)
    topic = select_next_topic(db)
    recent_titles = list(
        db.scalars(select(Insight.title).order_by(Insight.generated_at.desc()).limit(12)).all()
    )
    provider = get_ai_provider(demo_mode=settings.demo_mode, provider_name=settings.ai_provider)
    logger.info(
        "Generation start trigger=%s provider=%s topic=%s category=%s",
        trigger,
        provider.name,
        topic.name,
        topic.category,
    )
    try:
        payload = await asyncio.to_thread(
            provider.generate, topic.name, topic.category, recent_titles
        )
    except GenerationFailedError:
        logger.exception("Generation failed trigger=%s topic=%s", trigger, topic.name)
        db.rollback()
        raise
    except Exception as exc:
        logger.exception("Unexpected generation failure trigger=%s topic=%s", trigger, topic.name)
        db.rollback()
        raise GenerationFailedError("Insight generation failed.") from exc

    try:
        row = persist_insight(db, payload, source=provider.name)
        mark_topic_used(db, topic, when=datetime.now(timezone.utc))
        db.commit()
        db.refresh(row)
    except Exception:
        logger.exception("Database error while saving insight")
        db.rollback()
        raise

    logger.info(
        "Generation success id=%s trigger=%s provider=%s topic=%s",
        row.id,
        trigger,
        provider.name,
        topic.name,
    )
    return insight_to_out(row)
