from app.ai.base import AIProvider
from app.ai.bedrock_provider import BedrockProvider
from app.ai.demo_provider import DemoProvider
from app.core.config import get_settings


def get_ai_provider(demo_mode: bool | None = None, provider_name: str | None = None) -> AIProvider:
    settings = get_settings()
    use_demo = settings.demo_mode if demo_mode is None else demo_mode
    name = (provider_name or settings.ai_provider).lower()
    if use_demo or name == "demo":
        return DemoProvider()
    if name == "bedrock":
        return BedrockProvider()
    return DemoProvider()
