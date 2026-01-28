from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field

Channel = Literal["sms", "email"]


class SendRequest(BaseModel):
    template_key: str = Field(min_length=1, max_length=64)
    channel: Channel
    recipient: str = Field(min_length=1, max_length=256)
    context: dict[str, Any] = Field(default_factory=dict)


class SendResponse(BaseModel):
    ok: bool
    status: Literal["sent", "failed", "skipped"]
    message: str = ""
