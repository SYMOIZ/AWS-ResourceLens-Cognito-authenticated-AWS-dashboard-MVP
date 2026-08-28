from app.services.topic_service import select_next_topic
from app.db.session import get_session_factory
from app.models import Topic
from datetime import datetime, timezone


def test_topic_selection_skips_recent(client) -> None:
    SessionLocal = get_session_factory()
    db = SessionLocal()
    try:
        topics = list(db.query(Topic).filter(Topic.enabled.is_(True)).all()) if hasattr(db, "query") else []
        from sqlalchemy import select

        topics = list(db.scalars(select(Topic).where(Topic.enabled.is_(True))).all())
        now = datetime.now(timezone.utc)
        for index, topic in enumerate(topics[:6]):
            topic.last_used_at = now.replace(minute=index)
        db.commit()
        chosen = select_next_topic(db)
        recent_ids = {topic.id for topic in topics[:5]}
        assert chosen.id not in recent_ids or len(topics) <= 5
    finally:
        db.close()
