"""LLM service wrapper — OpenAI primary, Anthropic fallback, with token counting."""

import logging
from typing import TypeVar

from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_core.language_models import BaseChatModel
from pydantic import BaseModel

from app.config import settings

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)


def get_openai(
    *,
    model: str | None = None,
    temperature: float | None = None,
    premium: bool = False,
) -> ChatOpenAI:
    """Return a ChatOpenAI instance (gpt-4o-mini by default, gpt-4o if premium)."""
    return ChatOpenAI(
        api_key=settings.OPENAI_API_KEY,
        model=model or (settings.OPENAI_MODEL_PREMIUM if premium else settings.OPENAI_MODEL),
        temperature=temperature if temperature is not None else settings.LLM_TEMPERATURE,
        max_retries=settings.LLM_MAX_RETRIES,
    )


def get_anthropic(
    *,
    model: str | None = None,
    temperature: float | None = None,
) -> ChatAnthropic:
    """Return a ChatAnthropic instance (Claude 3.5 Sonnet fallback)."""
    return ChatAnthropic(
        api_key=settings.ANTHROPIC_API_KEY,
        model_name=model or settings.ANTHROPIC_MODEL,
        temperature=temperature if temperature is not None else settings.LLM_TEMPERATURE,
        max_retries=settings.LLM_MAX_RETRIES,
    )


def get_llm(*, premium: bool = False) -> BaseChatModel:
    """Get the best available LLM — OpenAI preferred, Anthropic fallback."""
    if settings.OPENAI_API_KEY:
        return get_openai(premium=premium)
    if settings.ANTHROPIC_API_KEY:
        logger.info("Using Anthropic fallback (no OpenAI key)")
        return get_anthropic()
    raise RuntimeError("No LLM API key configured — set OPENAI_API_KEY or ANTHROPIC_API_KEY")


async def invoke_structured(
    llm: BaseChatModel,
    schema: type[T],
    messages: list,
) -> tuple[T, int]:
    """Invoke an LLM with structured output and return (parsed result, token count).

    Falls back to Anthropic if the primary LLM call fails.
    """
    token_count = 0

    try:
        structured = llm.with_structured_output(schema)
        response = await structured.ainvoke(messages)
        token_count = _estimate_tokens(messages, response)
        return response, token_count  # type: ignore[return-value]
    except Exception as exc:
        logger.warning("Primary LLM failed (%s), trying fallback...", exc)

        if settings.ANTHROPIC_API_KEY and not isinstance(llm, ChatAnthropic):
            fallback = get_anthropic()
            structured = fallback.with_structured_output(schema)
            response = await structured.ainvoke(messages)
            token_count = _estimate_tokens(messages, response)
            return response, token_count  # type: ignore[return-value]

        raise


def _estimate_tokens(messages: list, response: object) -> int:
    """Rough token estimate: ~4 chars per token."""
    input_chars = sum(
        len(str(getattr(m, "content", m))) for m in messages
    )
    output_chars = len(str(response))
    return (input_chars + output_chars) // 4
