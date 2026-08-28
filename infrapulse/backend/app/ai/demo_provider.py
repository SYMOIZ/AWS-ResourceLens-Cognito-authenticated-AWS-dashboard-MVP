from datetime import datetime, timezone

from app.ai.base import AIProvider
from app.ai.demo_catalog import insights_for
from app.schemas.insight import InfrastructureInsight


class DemoProvider(AIProvider):
    name = "demo"

    def generate(self, topic: str, category: str, recent_titles: list[str]) -> InfrastructureInsight:
        candidates = insights_for(topic, category)
        recent = set(recent_titles)
        selected = next((item for item in candidates if item["title"] not in recent), candidates[0])
        payload = dict(selected)
        payload["topic"] = topic
        payload["category"] = category
        stamp = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        if payload["title"] in recent:
            payload["title"] = f"{payload['title']} ({stamp})"
        return InfrastructureInsight.model_validate(payload)
