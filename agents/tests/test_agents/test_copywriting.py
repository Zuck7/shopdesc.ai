"""Tests for the Copywriting agent with mocked LLM."""

import pytest
from unittest.mock import AsyncMock, patch

from app.models.schemas import (
    GenerationState,
    CopywritingOutput,
    ContentVariant,
    Platform,
    Tone,
)
from app.agents.copywriting import run_copywriting_agent


@pytest.fixture
def mock_variants():
    base = dict(
        description=(
            "Discover our organic cotton t-shirt made from 100% certified organic cotton. "
            "This eco friendly shirt offers all-day comfort with breathable fabric. "
            "Perfect for sustainable clothing enthusiasts. Machine washable for easy care."
        ),
        meta_title="Organic Cotton T-Shirt | EcoWear",
        meta_description="Shop our organic cotton t-shirt. Breathable, comfortable, eco-friendly. Free shipping over $50.",
        keywords=["organic cotton t-shirt", "eco friendly shirt"],
        bullet_points=["100% organic cotton", "Breathable", "Machine washable", "Eco-friendly", "Multiple sizes"],
        seo_score=80,
        readability_score=70,
        word_count=40,
    )
    return [
        ContentVariant(variant_label="A", title="Organic Cotton Tee — Eco Comfort", **base),
        ContentVariant(variant_label="B", title="EcoWear Organic T-Shirt", **base),
        ContentVariant(variant_label="C", title="Sustainable Cotton T-Shirt", **base),
    ]


@pytest.fixture
def mock_copywriting_output(mock_variants):
    return CopywritingOutput(variants=mock_variants)


@pytest.mark.asyncio
async def test_copywriting_produces_variants(product_input, product_brief, seo_strategy, mock_copywriting_output):
    """Agent should populate state.variants with 3 variants."""
    state = GenerationState(
        product=product_input,
        product_brief=product_brief,
        seo_strategy=seo_strategy,
        platform=Platform.SHOPIFY,
    )

    with patch("app.agents.copywriting.invoke_structured", new_callable=AsyncMock) as mock_invoke, \
         patch("app.agents.copywriting.apply_platform_format", side_effect=lambda p, v: v):
        mock_invoke.return_value = (mock_copywriting_output, 500)
        result = await run_copywriting_agent(state)

    assert len(result.variants) == 3
    assert result.total_tokens_used == 500


@pytest.mark.asyncio
async def test_copywriting_skips_without_brief(product_input, seo_strategy):
    """Agent should skip if product brief is missing."""
    state = GenerationState(product=product_input, product_brief=None, seo_strategy=seo_strategy)
    result = await run_copywriting_agent(state)
    assert result.variants == []
    assert any("skipped" in e.lower() for e in result.errors)


@pytest.mark.asyncio
async def test_copywriting_skips_without_seo(product_input, product_brief):
    """Agent should skip if SEO strategy is missing."""
    state = GenerationState(product=product_input, product_brief=product_brief, seo_strategy=None)
    result = await run_copywriting_agent(state)
    assert result.variants == []
    assert any("skipped" in e.lower() for e in result.errors)


@pytest.mark.asyncio
async def test_copywriting_uses_premium_llm(product_input, product_brief, seo_strategy, mock_copywriting_output):
    """Copywriting agent should use the premium LLM."""
    state = GenerationState(
        product=product_input,
        product_brief=product_brief,
        seo_strategy=seo_strategy,
    )

    with patch("app.agents.copywriting.get_llm") as mock_get_llm, \
         patch("app.agents.copywriting.invoke_structured", new_callable=AsyncMock) as mock_invoke, \
         patch("app.agents.copywriting.apply_platform_format", side_effect=lambda p, v: v):
        mock_invoke.return_value = (mock_copywriting_output, 300)
        await run_copywriting_agent(state)
        mock_get_llm.assert_called_once_with(premium=True)


@pytest.mark.asyncio
async def test_copywriting_includes_competitor_context(
    product_input, product_brief, seo_strategy, competitor_analysis, mock_copywriting_output
):
    """Agent should include competitor context when present."""
    state = GenerationState(
        product=product_input,
        product_brief=product_brief,
        seo_strategy=seo_strategy,
        competitor_analysis=competitor_analysis,
        include_competitor_analysis=True,
    )

    with patch("app.agents.copywriting.invoke_structured", new_callable=AsyncMock) as mock_invoke, \
         patch("app.agents.copywriting.apply_platform_format", side_effect=lambda p, v: v):
        mock_invoke.return_value = (mock_copywriting_output, 400)
        result = await run_copywriting_agent(state)

    assert len(result.variants) == 3
