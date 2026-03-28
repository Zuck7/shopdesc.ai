"""Tests for the SEO agent with mocked LLM and SerpAPI."""

import pytest
from unittest.mock import AsyncMock, patch

from app.models.schemas import (
    GenerationState,
    ProductInput,
    SEOStrategy,
    Keyword,
    Platform,
    Tone,
)
from app.agents.seo import run_seo_agent


@pytest.fixture
def mock_seo_strategy():
    return SEOStrategy(
        primary_keyword=Keyword(term="organic cotton t-shirt", relevance=0.95, keyword_type="primary"),
        secondary_keywords=[
            Keyword(term="eco friendly shirt", relevance=0.8, keyword_type="secondary"),
        ],
        long_tail_keywords=[
            Keyword(term="organic cotton t-shirt for men", relevance=0.7, keyword_type="long-tail"),
        ],
        target_word_count=200,
        target_keyword_density=2.0,
        meta_title_max_length=60,
        meta_description_max_length=155,
        platform_specific_notes="Optimise for Shopify.",
        search_intent="transactional",
    )


@pytest.mark.asyncio
async def test_seo_agent_attaches_strategy(product_input, product_brief, mock_seo_strategy):
    """Agent should populate state.seo_strategy from LLM."""
    state = GenerationState(product=product_input, product_brief=product_brief)

    with patch("app.agents.seo.get_llm") as mock_get_llm, \
         patch("app.agents.seo.invoke_structured", new_callable=AsyncMock) as mock_invoke, \
         patch("app.agents.seo.search_keywords", new_callable=AsyncMock, return_value={}):
        mock_invoke.return_value = (mock_seo_strategy, 120)
        result = await run_seo_agent(state)

    assert result.seo_strategy is not None
    assert result.seo_strategy.primary_keyword.term == "organic cotton t-shirt"
    assert result.total_tokens_used == 120


@pytest.mark.asyncio
async def test_seo_agent_skips_without_brief(product_input):
    """Agent should skip and append error if no product brief."""
    state = GenerationState(product=product_input, product_brief=None)
    result = await run_seo_agent(state)
    assert result.seo_strategy is None
    assert any("skipped" in e.lower() for e in result.errors)


@pytest.mark.asyncio
async def test_seo_agent_handles_serp_failure(product_input, product_brief, mock_seo_strategy):
    """Agent should continue even if SerpAPI call fails."""
    state = GenerationState(product=product_input, product_brief=product_brief)

    with patch("app.agents.seo.get_llm") as mock_get_llm, \
         patch("app.agents.seo.invoke_structured", new_callable=AsyncMock) as mock_invoke, \
         patch("app.agents.seo.search_keywords", new_callable=AsyncMock, side_effect=Exception("API down")):
        mock_invoke.return_value = (mock_seo_strategy, 100)
        result = await run_seo_agent(state)

    # Should succeed with LLM even if serp fails
    assert result.seo_strategy is not None
    assert result.total_tokens_used == 100


@pytest.mark.asyncio
async def test_seo_agent_uses_non_premium_llm(product_input, product_brief, mock_seo_strategy):
    """SEO agent should use the non-premium LLM."""
    state = GenerationState(product=product_input, product_brief=product_brief)

    with patch("app.agents.seo.get_llm") as mock_get_llm, \
         patch("app.agents.seo.invoke_structured", new_callable=AsyncMock) as mock_invoke, \
         patch("app.agents.seo.search_keywords", new_callable=AsyncMock, return_value={}):
        mock_invoke.return_value = (mock_seo_strategy, 100)
        await run_seo_agent(state)
        mock_get_llm.assert_called_once_with(premium=False)
