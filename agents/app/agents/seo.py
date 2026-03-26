"""SEO Agent — Agent 2 in the pipeline.

Researches keywords and produces an SEO strategy for the target platform.
"""

import logging

from langchain_core.messages import SystemMessage, HumanMessage

from app.models.schemas import GenerationState, SEOStrategy
from app.models.prompts import SEO_SYSTEM, SEO_USER
from app.services.llm import get_llm, invoke_structured
from app.services.serpapi import search_keywords, extract_related_keywords

logger = logging.getLogger(__name__)


async def run_seo_agent(state: GenerationState) -> GenerationState:
    """LangGraph node: produce an SEO strategy based on the product brief."""
    brief = state.product_brief
    if not brief:
        state.errors.append("SEO agent skipped — no product brief")
        return state

    logger.info("Running SEO agent for: %s on %s", brief.product_name, state.platform.value)

    # Try to get real keyword data from SerpAPI
    keyword_data = "No external keyword data available."
    try:
        search_query = f"{brief.product_name} {brief.category}"
        serp_data = await search_keywords(search_query)
        if serp_data:
            related = extract_related_keywords(serp_data)
            if related:
                keyword_data = "Related searches from Google:\n" + "\n".join(
                    f"- {kw}" for kw in related
                )
    except Exception as exc:
        logger.warning("SerpAPI keyword search failed: %s", exc)

    prompt = SEO_USER.format(
        platform=state.platform.value,
        product_name=brief.product_name,
        product_type=brief.product_type,
        category=brief.category,
        subcategory=brief.subcategory or "N/A",
        core_features=", ".join(brief.core_features),
        key_benefits=", ".join(brief.key_benefits),
        target_audience=brief.target_audience,
        unique_selling_points=", ".join(brief.unique_selling_points),
        price_positioning=brief.price_positioning,
        keyword_data=keyword_data,
    )

    messages = [
        SystemMessage(content=SEO_SYSTEM),
        HumanMessage(content=prompt),
    ]

    llm = get_llm(premium=False)
    strategy, tokens = await invoke_structured(llm, SEOStrategy, messages)

    state.seo_strategy = strategy
    state.total_tokens_used += tokens
    logger.info("SEO strategy complete — %d tokens", tokens)
    return state
