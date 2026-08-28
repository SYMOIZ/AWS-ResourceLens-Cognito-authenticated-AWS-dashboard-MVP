from abc import ABC, abstractmethod

from app.schemas.insight import InfrastructureInsight


class AIProvider(ABC):
    """Provider-agnostic generation contract.

    Local MVP uses DemoProvider. AWS migration swaps in BedrockProvider
    behind the same interface without changing orchestration code.
    """

    name: str

    @abstractmethod
    def generate(self, topic: str, category: str, recent_titles: list[str]) -> InfrastructureInsight:
        raise NotImplementedError
