from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class TopicOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    category: str
    enabled: bool
    last_used_at: datetime | None = None


class TopicCreate(BaseModel):
    name: str = Field(min_length=4, max_length=160)
    category: str = Field(min_length=2, max_length=80)
    enabled: bool = True


class TopicUpdate(BaseModel):
    enabled: bool | None = None
    name: str | None = Field(default=None, min_length=4, max_length=160)
    category: str | None = Field(default=None, min_length=2, max_length=80)
