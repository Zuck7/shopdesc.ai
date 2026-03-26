"""Competitor Analysis Agent — Agent 4 (optional, runs in parallel).

Analyses top competitor listings and identifies gaps / opportunities.
"""

import logging

from langchain_core.messages import SystemMessage, HumanMessage

from app.models.schemas import GenerationState, CompetitorAnalysis
from app.models.prompts import COMPETITOR_SYSTEM, COMPETITOR_USER
from app.services.llm import get_llm, invoke_structured
from app.services.serpapi import search_keywords, extract_competitor_listings

logger = logging.getLogger(__name__)


async def run_competitor_agent(state: GenerationState) -> GenerationState:
    """LangGraph node: analyse competitor listings and attach analysis to state."""
    brief = state.product_brief
    seo = state.seo_strategy
    if not brief or not seo:
        state.errors.append("Competitor agent skipped — missing brief or SEO strategy")
        return state

    logger.info("Running competitor analysis for: %s", brief.product_name)

    # Fetch competitor data from SerpAPI
    search_results_text = "No competitor search data available."
    try:
        query = f"{seo.primary_keyword.term} {state.platform.value} product listing"
        serp_data = await search_keywords(query, num=5)
        if serp_data:
            listings = extract_competitor_listings(serp_data)
            if listings:
                lines = []
                for i, listing in enumerate(listings, 1):
                    lines.append(
                        f"{i}. Title: {listing['title']}\n"
                        f"   URL: {listing.get('url', 'N/A')}\n"
                        f"   Snippet: {listing.get('snippet', 'N/A')}"
                    )
                search_results_text = "\n".join(lines)
    except Exception as exc:
        logger.warning("SerpAPI competitor search failed: %s", exc)

    prompt = COMPETITOR_USER.format(
        product_name=brief.product_name,
        category=brief.category,
        primary_keyword=seo.primary_keyword.term,
        platform=state.platform.value,
        search_results=search_results_text,
    )

    messages = [
        SystemMessage(content=COMPETITOR_SYSTEM),
        HumanMessage(content=prompt),
    ]

    llm = get_llm(premium=False)
    analysis, tokens = await invoke_structured(llm, CompetitorAnalysis, messages)

    state.competitor_analysis = analysis
    state.total_tokens_used += tokens
    logger.info("Competitor analysis complete — %d tokens", tokens)
    return state
