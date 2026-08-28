from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, NotFoundError
from app.models import Topic


def list_topics(db: Session) -> list[Topic]:
    return list(db.scalars(select(Topic).order_by(Topic.category, Topic.name)).all())


def get_topic(db: Session, topic_id: int) -> Topic:
    topic = db.get(Topic, topic_id)
    if topic is None:
        raise NotFoundError(f"Topic {topic_id} was not found.")
    return topic


def create_topic(db: Session, name: str, category: str, enabled: bool = True) -> Topic:
    existing = db.scalar(select(Topic).where(Topic.name == name.strip()))
    if existing is not None:
        raise ConflictError(f"Topic '{name}' already exists.")
    topic = Topic(name=name.strip(), category=category.strip(), enabled=enabled)
    db.add(topic)
    db.commit()
    db.refresh(topic)
    return topic


def update_topic(db: Session, topic_id: int, **changes) -> Topic:
    topic = get_topic(db, topic_id)
    for key, value in changes.items():
        if value is not None:
            setattr(topic, key, value)
    db.commit()
    db.refresh(topic)
    return topic


def mark_topic_used(db: Session, topic: Topic, when: datetime | None = None) -> None:
    topic.last_used_at = when or datetime.now(timezone.utc)
    db.add(topic)


def select_next_topic(db: Session) -> Topic:
    enabled = list(db.scalars(select(Topic).where(Topic.enabled.is_(True))).all())
    if not enabled:
        raise ConflictError("No enabled topics are available for generation.")

    unused = [topic for topic in enabled if topic.last_used_at is None]
    if unused:
        unused.sort(key=lambda item: (item.category, item.name))
        return unused[0]

    recent = sorted(
        (topic for topic in enabled if topic.last_used_at is not None),
        key=lambda item: item.last_used_at or datetime.min.replace(tzinfo=timezone.utc),
        reverse=True,
    )
    cooldown = {topic.id for topic in recent[: min(5, max(len(recent) - 1, 0))]}
    candidates = [topic for topic in enabled if topic.id not in cooldown] or enabled
    candidates.sort(
        key=lambda item: (
            item.last_used_at or datetime.min.replace(tzinfo=timezone.utc),
            item.name,
        )
    )
    return candidates[0]
