from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


AssistantSource = Literal[
    "flood_history",
    "flood_susceptibility",
    "population_exposure",
    "evacuation_sites",
    "rivers",
]


class AssistantMessage(BaseModel):
    model_config = ConfigDict(extra="forbid")

    role: Literal["user", "model"]
    content: str = Field(min_length=1, max_length=2000)


class AssistantChatRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    messages: list[AssistantMessage] = Field(min_length=1, max_length=12)
    sources: list[AssistantSource] = Field(min_length=1, max_length=5)

    @model_validator(mode="after")
    def last_message_must_be_user(self):
        if self.messages[0].role != "user":
            raise ValueError("Percakapan harus dimulai dari pesan pengguna.")
        if self.messages[-1].role != "user":
            raise ValueError("Pesan terakhir harus berasal dari pengguna.")
        if any(
            first.role == second.role
            for first, second in zip(self.messages, self.messages[1:])
        ):
            raise ValueError("Peran pesan harus bergantian antara pengguna dan asisten.")
        return self


class AssistantChatResponse(BaseModel):
    answer: str
    sources: list[AssistantSource]
    model: str
