from fastapi.testclient import TestClient
from sqlalchemy import select

from app.ai.demo_provider import DemoProvider
from app.db.session import get_session_factory
from app.models import Insight, Topic
from app.schemas.insight import InfrastructureInsight
from app.services.topic_service import select_next_topic


def test_health(client: TestClient) -> None:
    response = client.get("/api/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["service"] == "InfraPulse"


def test_status(client: TestClient) -> None:
    response = client.get("/api/status")
    assert response.status_code == 200
    body = response.json()
    assert body["demo_mode"] is True
    assert "scheduler" in body
    assert body["total_insights"] >= 0


def test_demo_provider_returns_valid_insight() -> None:
    provider = DemoProvider()
    insight = provider.generate(
        "IAM least privilege for production roles",
        "AWS",
        recent_titles=[],
    )
    assert isinstance(insight, InfrastructureInsight)
    assert insight.category == "AWS"
    assert len(insight.best_practices) >= 2
    assert len(insight.tags) >= 3


def test_insight_validation_rejects_short_fields() -> None:
    payload = {
        "title": "Too short",
        "topic": "x",
        "category": "AWS",
        "summary": "short",
        "real_world_scenario": "short",
        "technical_explanation": "short",
        "architecture": "short",
        "best_practices": ["one"],
        "practical_recommendation": "short",
        "common_mistakes": ["one"],
        "what_to_learn_next": ["one"],
        "tags": ["a"],
    }
    try:
        InfrastructureInsight.model_validate(payload)
        assert False, "expected validation error"
    except Exception:
        pass


def test_topic_selection_prefers_unused(client: TestClient) -> None:
    SessionLocal = get_session_factory()
    db = SessionLocal()
    try:
        first = select_next_topic(db)
        assert first.last_used_at is None
        first.last_used_at = first.last_used_at
        from datetime import datetime, timezone

        first.last_used_at = datetime.now(timezone.utc)
        db.commit()
        second = select_next_topic(db)
        assert second.id != first.id
        assert second.last_used_at is None
    finally:
        db.close()


def test_generate_and_retrieve_today(client: TestClient) -> None:
    generated = client.post("/api/insights/generate")
    assert generated.status_code == 200, generated.text
    body = generated.json()
    assert body["message"] == "Generated successfully"
    insight = body["insight"]
    assert insight["id"] > 0
    assert insight["generation_source"] == "demo"

    today = client.get("/api/insights/today")
    assert today.status_code == 200
    assert today.json()["id"] == insight["id"]

    listed = client.get("/api/insights")
    assert listed.status_code == 200
    assert listed.json()["total"] >= 1

    detail = client.get(f"/api/insights/{insight['id']}")
    assert detail.status_code == 200
    assert detail.json()["title"] == insight["title"]


def test_scheduler_skips_duplicate_day(client: TestClient) -> None:
    first = client.post("/api/scheduler/run")
    assert first.status_code == 200, first.text
    if first.json()["skipped"]:
        # today already existed from a previous test in this module order
        existing_id = first.json()["insight_id"]
    else:
        existing_id = first.json()["insight_id"]
        second = client.post("/api/scheduler/run")
        assert second.status_code == 200
        assert second.json()["skipped"] is True
        assert second.json()["reason"] == "today_exists"
        assert second.json()["insight_id"] == existing_id
        return

    second = client.post("/api/scheduler/run")
    assert second.status_code == 200
    assert second.json()["skipped"] is True
    assert second.json()["reason"] == "today_exists"


def test_api_validation_on_topic_create(client: TestClient) -> None:
    response = client.post("/api/topics", json={"name": "x", "category": "AWS"})
    assert response.status_code == 422
    payload = response.json()
    assert payload["error"]["code"] == "validation_error"


def test_topics_and_settings(client: TestClient) -> None:
    topics = client.get("/api/topics")
    assert topics.status_code == 200
    assert len(topics.json()) >= 10

    settings = client.get("/api/settings")
    assert settings.status_code == 200
    assert settings.json()["demo_mode"] is True

    patched = client.patch("/api/settings", json={"schedule_time": "08:30"})
    assert patched.status_code == 200
    assert patched.json()["schedule_time"] == "08:30"


def test_missing_insight_returns_404(client: TestClient) -> None:
    response = client.get("/api/insights/999999")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "not_found"


def test_generation_persists_to_sqlite(client: TestClient) -> None:
    client.post("/api/insights/generate")
    SessionLocal = get_session_factory()
    db = SessionLocal()
    try:
        rows = list(db.scalars(select(Insight)).all())
        assert len(rows) >= 1
        enabled = list(db.scalars(select(Topic).where(Topic.enabled.is_(True))).all())
        assert enabled
    finally:
        db.close()
