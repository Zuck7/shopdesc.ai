"""Tests for the Competitor Analysis agent with mocked LLM and SerpAPI."""

import pytest
from unittest.mock import AsyncMock, patch

from app.models.schemas import (
    GenerationState,
    CompetitorAnalysis,
    CompetitorListing,
)
from app.agents.competitor import run_competitor_agent


@pytest.fixture
def mock_competitor_analysis():
    return CompetitorAnalysis(
        top_competitors=[
            CompetitorListing(
                title="Rival Organic Tee",
                url="https://example.com/rival",
                platform="shopify",
                strengths=["Strong branding"],
                weaknesses=["Limited sizing"],
            )
        ],
        common_keywords=["organic cotton", "sustainable"],
        content_gaps=["No certifications mentioned"],
        differentiation_suggestions=["Highlight GOTS certification"],
        average_title_length=50,
        average_description_length=200,
    )


@pytest.mark.asyncio
async def test_competitor_agent_attaches_analysis(
    product_input, product_brief, seo_strategy, mock_competitor_analysis
):
    """Agent should populate state.competitor_analysis."""
    state = GenerationState(
        product=product_input,
        product_brief=product_brief,
        seo_strategy=seo_strategy,
        include_competitor_analysis=True,
    )

    with patch("app.agents.competitor.invoke_structured", new_callable=AsyncMock) as mock_invoke, \
         patch("app.agents.competitor.search_keywords", new_callable=AsyncMock, return_value={}):
        mock_invoke.return_value = (mock_competitor_analysis, 180)
        result = await run_competitor_agent(state)

    assert result.competitor_analysis is not None
    assert len(result.competitor_analysis.top_competitors) == 1
    assert result.total_tokens_used == 180


@pytest.mark.asyncio
async def test_competitor_agent_skips_without_brief(product_input):
    """Agent should skip if product brief is missing."""
    state = GenerationState(product=product_input, product_brief=None)
    result = await run_competitor_agent(state)
    assert result.competitor_analysis is None
    assert any("skipped" in e.lower() for e in result.errors)


@pytest.mark.asyncio
async def test_competitor_agent_skips_without_seo(product_input, product_brief):
    """Agent should skip if SEO strategy is missing."""
    state = GenerationState(product=product_input, product_brief=product_brief, seo_strategy=None)
    result = await run_competitor_agent(state)
    assert result.competitor_analysis is None
    assert any("skipped" in e.lower() for e in result.errors)


@pytest.mark.asyncio
async def test_competitor_agent_handles_serp_failure(
    product_input, product_brief, seo_strategy, mock_competitor_analysis
):
    """Agent should continue even if SerpAPI fails."""
    state = GenerationState(
        product=product_input,
        product_brief=product_brief,
        seo_strategy=seo_strategy,
    )

    with patch("app.agents.competitor.invoke_structured", new_callable=AsyncMock) as mock_invoke, \
         patch("app.agents.competitor.search_keywords", new_callable=AsyncMock, side_effect=Exception("API down")):
        mock_invoke.return_value = (mock_competitor_analysis, 150)
        result = await run_competitor_agent(state)

    assert result.competitor_analysis is not None
