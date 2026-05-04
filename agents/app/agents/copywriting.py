"""Copywriting Agent — Agent 3 in the pipeline.

Generates 3 content variants with tone control and platform-aware limits.
"""

import logging
import re

from langchain_core.messages import SystemMessage, HumanMessage

from app.models.schemas import GenerationState, CopywritingOutput
from app.models.prompts import (
    COPYWRITING_SYSTEM,
    COPYWRITING_USER,
    PLATFORM_CONSTRAINTS,
)
from app.services.llm import get_llm, invoke_structured
from app.services.scoring import calculate_seo_score, calculate_readability_score
from app.services.formatting import apply_platform_format

logger = logging.getLogger(__name__)


def _strip_html(text: str) -> str:
    return re.sub(r"<[^>]+>", " ", text)


def _build_scoring_text(description: str, bullet_points: list[str]) -> str:
    description_text = _strip_html(description).strip()
    bullets_text = " ".join(bp.strip() for bp in bullet_points if bp and bp.strip())
    return "\n".join(part for part in [description_text, bullets_text] if part).strip()


async def run_copywriting_agent(state: GenerationState) -> GenerationState:
    """LangGraph node: generate 3 content variants."""
    brief = state.product_brief
    seo = state.seo_strategy
    if not brief or not seo:
        state.errors.append("Copywriting agent skipped — missing brief or SEO strategy")
        return state

    logger.info("Running copywriting agent for: %s", brief.product_name)

    platform_constraints = PLATFORM_CONSTRAINTS.get(
        state.platform.value, PLATFORM_CONSTRAINTS["generic"]
    )

    custom_tone = ""
    if state.custom_tone_instructions:
        custom_tone = f"Custom tone instructions: {state.custom_tone_instructions}"

    competitor_context = ""
    if state.competitor_analysis:
        ca = state.competitor_analysis
        competitor_context = (
            "Competitor insights:\n"
            f"- Content gaps: {', '.join(ca.content_gaps)}\n"
            f"- Differentiation suggestions: {', '.join(ca.differentiation_suggestions)}\n"
            f"- Common competitor keywords: {', '.join(ca.common_keywords)}"
        )

    system_prompt = COPYWRITING_SYSTEM.format(
        tone=state.tone.value,
        custom_tone_instructions=custom_tone,
        platform_constraints=platform_constraints,
    )

    user_prompt = COPYWRITING_USER.format(
        product_name=brief.product_name,
        product_type=brief.product_type,
        category=brief.category,
        core_features=", ".join(brief.core_features),
        key_benefits=", ".join(brief.key_benefits),
        target_audience=brief.target_audience,
        unique_selling_points=", ".join(brief.unique_selling_points),
        emotional_triggers=", ".join(brief.emotional_triggers),
        primary_keyword=seo.primary_keyword.term,
        secondary_keywords=", ".join(k.term for k in seo.secondary_keywords),
        long_tail_keywords=", ".join(k.term for k in seo.long_tail_keywords),
        target_word_count=seo.target_word_count,
        target_keyword_density=seo.target_keyword_density,
        competitor_context=competitor_context or "No competitor data available.",
    )

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_prompt),
    ]

    # Copywriting uses the premium model for higher quality output
    llm = get_llm(premium=True)
    output, tokens = await invoke_structured(llm, CopywritingOutput, messages)

    # Re-calculate scores with our own scoring functions for consistency
    secondary_terms = [k.term for k in seo.secondary_keywords]
    for variant in output.variants:
        # Apply platform-specific formatting / enforcement
        vdict = variant.model_dump()
        vdict = apply_platform_format(state.platform.value, vdict)
        variant.title = vdict["title"]
        variant.description = vdict["description"]
        variant.meta_title = vdict["meta_title"]
        variant.meta_description = vdict["meta_description"]
        variant.keywords = vdict.get("keywords", variant.keywords)
        variant.bullet_points = vdict.get("bullet_points", variant.bullet_points)

        scoring_text = _build_scoring_text(variant.description, variant.bullet_points)
        if not scoring_text:
            scoring_text = _strip_html(variant.description).strip()

        variant.seo_score = calculate_seo_score(
            text=scoring_text,
            title=variant.title,
            meta_title=variant.meta_title,
            meta_description=variant.meta_description,
            primary_keyword=seo.primary_keyword.term,
            secondary_keywords=secondary_terms,
        )
        variant.readability_score = calculate_readability_score(scoring_text)
        variant.word_count = len(scoring_text.split())

    state.variants = output.variants
    state.total_tokens_used += tokens
    logger.info("Copywriting complete — %d tokens, %d variants", tokens, len(output.variants))
    return state
