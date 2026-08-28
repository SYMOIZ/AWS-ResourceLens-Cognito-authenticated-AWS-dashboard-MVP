import json
import logging
import re

import boto3
from botocore.exceptions import BotoCoreError, ClientError
from pydantic import ValidationError

from app.ai.base import AIProvider
from app.core.config import get_settings
from app.core.exceptions import GenerationFailedError
from app.schemas.insight import InfrastructureInsight

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are InfraPulse, an infrastructure engineering agent.
Return ONLY valid JSON (no markdown) with these keys:
title, topic, category, summary, real_world_scenario, technical_explanation,
architecture, best_practices, practical_recommendation, common_mistakes,
what_to_learn_next, tags.

Rules:
- Write for experienced infrastructure engineers.
- Be specific and operational, not motivational.
- best_practices, common_mistakes, what_to_learn_next, and tags must be arrays of strings.
- Do not include secrets, credentials, exploit payloads, or runnable attack steps.
"""


class BedrockProvider(AIProvider):
    name = "bedrock"

    def generate(self, topic: str, category: str, recent_titles: list[str]) -> InfrastructureInsight:
        settings = get_settings()
        if not settings.bedrock_model_id:
            raise GenerationFailedError(
                "BEDROCK_MODEL_ID is not configured. Set it or switch AI_PROVIDER=demo."
            )

        client = boto3.client("bedrock-runtime", region_name=settings.aws_region)
        user_prompt = {
            "topic": topic,
            "category": category,
            "avoid_titles": recent_titles[:8],
            "instruction": "Generate one new infrastructure insight for the given topic.",
        }
        try:
            response = client.converse(
                modelId=settings.bedrock_model_id,
                system=[{"text": SYSTEM_PROMPT}],
                messages=[
                    {
                        "role": "user",
                        "content": [{"text": json.dumps(user_prompt)}],
                    }
                ],
                inferenceConfig={"maxTokens": 2400, "temperature": 0.4},
            )
        except (ClientError, BotoCoreError) as exc:
            logger.exception("Bedrock invoke failed")
            raise GenerationFailedError("Amazon Bedrock did not return a usable response.") from exc

        text = _extract_text(response)
        payload = _parse_json(text)
        payload["topic"] = topic
        payload["category"] = category
        try:
            return InfrastructureInsight.model_validate(payload)
        except ValidationError as exc:
            logger.warning("Bedrock JSON failed insight validation: %s", exc)
            raise GenerationFailedError("Bedrock returned JSON that failed schema validation.") from exc


def _extract_text(response: dict) -> str:
    contents = response.get("output", {}).get("message", {}).get("content", [])
    texts = [item.get("text", "") for item in contents if "text" in item]
    return "\n".join(texts).strip()


def _parse_json(text: str) -> dict:
    cleaned = text.strip()
    fenced = re.search(r"```(?:json)?\s*(\{.*\})\s*```", cleaned, re.DOTALL)
    if fenced:
        cleaned = fenced.group(1)
    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        raise GenerationFailedError("Bedrock did not return valid JSON.") from exc
    if not isinstance(data, dict):
        raise GenerationFailedError("Bedrock JSON root must be an object.")
    return data
