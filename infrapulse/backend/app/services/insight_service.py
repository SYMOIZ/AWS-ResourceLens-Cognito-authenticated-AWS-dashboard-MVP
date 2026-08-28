import logging
from datetime import datetime, time, timezone
from zoneinfo import ZoneInfo

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.models import Insight
from app.schemas.insight import InfrastructureInsight, InsightOut
from app.services.settings_service import get_public_settings

logger = logging.getLogger(__name__)


def ensure_utc(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def insight_to_out(row: Insight) -> InsightOut:
    return InsightOut(
        id=row.id,
        title=row.title,
        topic=row.topic,
        category=row.category,
        summary=row.summary,
        real_world_scenario=row.real_world_scenario,
        technical_explanation=row.technical_explanation,
        architecture=row.architecture,
        best_practices=row.best_practices or [],
        practical_recommendation=row.practical_recommendation,
        common_mistakes=row.common_mistakes or [],
        what_to_learn_next=row.what_to_learn_next or [],
        tags=row.tags or [],
        generated_at=ensure_utc(row.generated_at) or row.generated_at,
        generation_source=row.generation_source,
    )


def local_day_bounds(tz_name: str, now: datetime | None = None) -> tuple[datetime, datetime]:
    tz = ZoneInfo(tz_name)
    current = (now or datetime.now(timezone.utc)).astimezone(tz)
    start = datetime.combine(current.date(), time.min, tzinfo=tz)
    end = datetime.combine(current.date(), time.max, tzinfo=tz)
    return start.astimezone(timezone.utc), end.astimezone(timezone.utc)


def get_today_insight(db: Session) -> Insight | None:
    settings = get_public_settings(db)
    start, end = local_day_bounds(settings.timezone)
    stmt = (
        select(Insight)
        .where(Insight.generated_at >= start, Insight.generated_at <= end)
        .order_by(Insight.generated_at.desc())
    )
    return db.scalars(stmt).first()


def get_insight(db: Session, insight_id: int) -> Insight:
    row = db.get(Insight, insight_id)
    if row is None:
        raise NotFoundError(f"Insight {insight_id} was not found.")
    return row


def list_insights(
    db: Session,
    *,
    query: str | None = None,
    category: str | None = None,
    topic: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[Insight], int]:
    stmt = select(Insight)
    count_stmt = select(func.count(Insight.id))
    if query:
        like = f"%{query.strip()}%"
        filter_clause = or_(
            Insight.title.ilike(like),
            Insight.summary.ilike(like),
            Insight.topic.ilike(like),
            Insight.category.ilike(like),
            Insight.practical_recommendation.ilike(like),
        )
        stmt = stmt.where(filter_clause)
        count_stmt = count_stmt.where(filter_clause)
    if category:
        stmt = stmt.where(Insight.category == category)
        count_stmt = count_stmt.where(Insight.category == category)
    if topic:
        stmt = stmt.where(Insight.topic == topic)
        count_stmt = count_stmt.where(Insight.topic == topic)

    total = db.scalar(count_stmt) or 0
    rows = list(
        db.scalars(stmt.order_by(Insight.generated_at.desc()).offset(offset).limit(limit)).all()
    )
    return rows, total


def count_insights(db: Session) -> int:
    return int(db.scalar(select(func.count(Insight.id))) or 0)


def last_successful_generation(db: Session) -> datetime | None:
    return ensure_utc(db.scalar(select(func.max(Insight.generated_at))))


def persist_insight(
    db: Session,
    payload: InfrastructureInsight,
    source: str,
    generated_at: datetime | None = None,
) -> Insight:
    row = Insight(
        title=payload.title,
        topic=payload.topic,
        category=payload.category,
        summary=payload.summary,
        real_world_scenario=payload.real_world_scenario,
        technical_explanation=payload.technical_explanation,
        architecture=payload.architecture,
        best_practices=payload.best_practices,
        practical_recommendation=payload.practical_recommendation,
        common_mistakes=payload.common_mistakes,
        what_to_learn_next=payload.what_to_learn_next,
        tags=payload.tags,
        generated_at=generated_at or datetime.now(timezone.utc),
        generation_source=source,
    )
    db.add(row)
    return row
