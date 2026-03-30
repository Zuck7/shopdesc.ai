"""Tests for the Product Analysis agent with mocked LLM."""

import pytest
from unittest.mock import AsyncMock, patch

from app.models.schemas import GenerationState, ProductInput, ProductBrief, Platform, Tone
from app.agents.product_analysis import run_product_analysis


@pytest.fixture
def mock_brief():
    return ProductBrief(
        product_name="Organic Cotton T-Shirt",
        product_type="T-Shirt",
        category="Clothing",
        subcategory="T-Shirts",
        core_features=["100% organic cotton", "Breathable", "Machine washable"],
        key_benefits=["Eco-friendly", "Comfortable"],
        target_audience="Eco-conscious consumers",
        use_cases=["Casual wear"],
        unique_selling_points=["Certified organic"],
        price_positioning="mid-range",
        emotional_triggers=["sustainability"],
    )


@pytest.mark.asyncio
async def test_product_analysis_attaches_brief(product_input, mock_brief):
    """Agent should populate state.product_brief from LLM."""
    state = GenerationState(product=product_input)

    with patch("app.agents.product_analysis.invoke_structured", new_callable=AsyncMock) as mock_invoke:
        mock_invoke.return_value = (mock_brief, 150)
        result = await run_product_analysis(state)

    assert result.product_brief is not None
    assert result.product_brief.product_name == "Organic Cotton T-Shirt"
    assert result.total_tokens_used == 150


@pytest.mark.asyncio
async def test_product_analysis_token_accumulation(product_input, mock_brief):
    """Tokens should accumulate on state."""
    state = GenerationState(product=product_input, total_tokens_used=100)

    with patch("app.agents.product_analysis.invoke_structured", new_callable=AsyncMock) as mock_invoke:
        mock_invoke.return_value = (mock_brief, 200)
        result = await run_product_analysis(state)

    assert result.total_tokens_used == 300


@pytest.mark.asyncio
async def test_product_analysis_uses_non_premium_llm(product_input, mock_brief):
    """Product analysis should use the non-premium LLM."""
    state = GenerationState(product=product_input)

    with patch("app.agents.product_analysis.get_llm") as mock_get_llm, \
         patch("app.agents.product_analysis.invoke_structured", new_callable=AsyncMock) as mock_invoke:
        mock_invoke.return_value = (mock_brief, 100)
        await run_product_analysis(state)
        mock_get_llm.assert_called_once_with(premium=False)
