from datetime import datetime

from pydantic import BaseModel, Field, field_validator


def _require_text(value: str, field_name: str, minimum: int = 12) -> str:
    cleaned = " ".join(value.split()).strip()
    if len(cleaned) < minimum:
        raise ValueError(f"{field_name} must contain at least {minimum} characters")
    return cleaned


def _require_list(values: list[str], field_name: str, minimum: int = 2) -> list[str]:
    cleaned = [item.strip() for item in values if item and item.strip()]
    if len(cleaned) < minimum:
        raise ValueError(f"{field_name} must contain at least {minimum} items")
    return cleaned


class InfrastructureInsight(BaseModel):
    title: str
    topic: str
    category: str
    summary: str
    real_world_scenario: str
    technical_explanation: str
    architecture: str
    best_practices: list[str]
    practical_recommendation: str
    common_mistakes: list[str]
    what_to_learn_next: list[str]
    tags: list[str]

    @field_validator(
        "title",
        "topic",
        "category",
        "summary",
        "real_world_scenario",
        "technical_explanation",
        "architecture",
        "practical_recommendation",
    )
    @classmethod
    def validate_text(cls, value: str, info) -> str:
        if info.field_name == "category":
            minimum = 2
        elif info.field_name in {"title", "topic"}:
            minimum = 8
        else:
            minimum = 24
        return _require_text(value, info.field_name, minimum)

    @field_validator("best_practices", "common_mistakes", "what_to_learn_next", "tags")
    @classmethod
    def validate_lists(cls, value: list[str], info) -> list[str]:
        minimum = 2 if info.field_name != "tags" else 3
        return _require_list(value, info.field_name, minimum)


class InsightOut(InfrastructureInsight):
    id: int
    generated_at: datetime
    generation_source: str


class InsightListOut(BaseModel):
    items: list[InsightOut]
    total: int


class GenerateInsightResponse(BaseModel):
    insight: InsightOut
    message: str
