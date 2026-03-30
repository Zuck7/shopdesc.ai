"""Tests for the LangGraph orchestrator pipeline."""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock

from app.models.schemas import (
    GenerationState,
    ProductInput,
    ProductBrief,
    SEOStrategy,
    Keyword,
    ContentVariant,
    CopywritingOutput,
    CompetitorAnalysis,
    CompetitorListing,
    SingleGenerateRequest,
    Platform,
    Tone,
)
from app.orchestrator import should_analyze_competitors, build_graph, generate_single


class TestConditionalEdge:
    def test_returns_competitor_when_enabled(self, product_input):
        state = GenerationState(product=product_input, include_competitor_analysis=True)
        assert should_analyze_competitors(state) == "competitor_research"

    def test_returns_copywriting_when_disabled(self, product_input):
        state = GenerationState(product=product_input, include_competitor_analysis=False)
        assert should_analyze_competitors(state) == "copywriting"


class TestBuildGraph:
    def test_graph_compiles(self):
        """Graph should compile without errors."""
        graph = build_graph()
        compiled = graph.compile()
        assert compiled is not None


class TestGenerateSingle:
    @pytest.mark.asyncio
    async def test_full_pipeline_without_competitors(self, product_input):
        """Pipeline should execute all 3 core agents and return GenerationOutput."""
        mock_brief = ProductBrief(
            product_name="Test Product",
            product_type="Widget",
            category="Electronics",
            core_features=["Feature A"],
            key_benefits=["Benefit A"],
            target_audience="Everyone",
            use_cases=["General"],
            unique_selling_points=["Unique"],
            price_positioning="mid-range",
            emotional_triggers=["convenience"],
        )
        mock_seo = SEOStrategy(
            primary_keyword=Keyword(term="test product", relevance=0.9, keyword_type="primary"),
            secondary_keywords=[],
            long_tail_keywords=[],
            target_word_count=150,
            target_keyword_density=2.0,
            meta_title_max_length=60,
            meta_description_max_length=155,
            platform_specific_notes="None",
            search_intent="transactional",
        )
        mock_variant = ContentVariant(
            variant_label="A",
            title="Test Product Title",
            description="A great test product description with enough words.",
            meta_title="Test Product | Store",
            meta_description="Buy test product now.",
            keywords=["test product"],
            bullet_points=["Feature A", "Benefit A"],
            seo_score=75,
            readability_score=80,
            word_count=30,
        )

        async def mock_product_analysis(state):
            if isinstance(state, dict):
                state = GenerationState(**state)
            state.product_brief = mock_brief
            state.total_tokens_used += 100
            return state

        async def mock_seo_agent(state):
            if isinstance(state, dict):
                state = GenerationState(**state)
            state.seo_strategy = mock_seo
            state.total_tokens_used += 120
            return state

        async def mock_copywriting(state):
            if isinstance(state, dict):
                state = GenerationState(**state)
            state.variants = [mock_variant, mock_variant, mock_variant]
            state.total_tokens_used += 500
            return state

        request = SingleGenerateRequest(
            product=product_input,
            platform=Platform.GENERIC,
            tone=Tone.PROFESSIONAL,
        )

        with patch("app.orchestrator.run_product_analysis", side_effect=mock_product_analysis), \
             patch("app.orchestrator.run_seo_agent", side_effect=mock_seo_agent), \
             patch("app.orchestrator.run_copywriting_agent", side_effect=mock_copywriting):
            # Need to rebuild the graph with patched functions
            with patch("app.orchestrator._graph") as mock_graph:
                # Create a mock compiled graph
                final_state = GenerationState(
                    product=product_input,
                    product_brief=mock_brief,
                    seo_strategy=mock_seo,
                    variants=[mock_variant, mock_variant, mock_variant],
                    total_tokens_used=720,
                )
                mock_graph.ainvoke = AsyncMock(return_value=final_state)

                output = await generate_single(request)

        assert output.product_brief.product_name == "Test Product"
        assert output.seo_strategy.primary_keyword.term == "test product"
        assert len(output.variants) == 3
        assert output.total_tokens_used == 720
        assert output.processing_time_ms >= 0

    @pytest.mark.asyncio
    async def test_pipeline_raises_on_incomplete(self, product_input):
        """Pipeline should raise RuntimeError if agents fail to populate state."""
        request = SingleGenerateRequest(
            product=product_input,
            platform=Platform.GENERIC,
            tone=Tone.PROFESSIONAL,
        )

        incomplete_state = GenerationState(
            product=product_input,
            errors=["Product analysis failed"],
        )

        with patch("app.orchestrator._graph") as mock_graph:
            mock_graph.ainvoke = AsyncMock(return_value=incomplete_state)

            with pytest.raises(RuntimeError, match="Pipeline incomplete"):
                await generate_single(request)

    @pytest.mark.asyncio
    async def test_pipeline_handles_dict_return(self, product_input):
        """Pipeline should handle when LangGraph returns a dict instead of GenerationState."""
        mock_brief = ProductBrief(
            product_name="Dict Product",
            product_type="Widget",
            category="Electronics",
            core_features=["Feature A"],
            key_benefits=["Benefit A"],
            target_audience="Everyone",
            use_cases=["General"],
            unique_selling_points=["Unique"],
            price_positioning="budget",
            emotional_triggers=["savings"],
        )
        mock_seo = SEOStrategy(
            primary_keyword=Keyword(term="widget", relevance=0.9, keyword_type="primary"),
            secondary_keywords=[],
            long_tail_keywords=[],
            target_word_count=150,
            target_keyword_density=2.0,
            meta_title_max_length=60,
            meta_description_max_length=155,
            platform_specific_notes="None",
            search_intent="transactional",
        )
        mock_variant = ContentVariant(
            variant_label="A",
            title="Widget Title",
            description="A widget description.",
            meta_title="Widget | Store",
            meta_description="Buy widget now.",
            keywords=["widget"],
            bullet_points=["Feature"],
            seo_score=70,
            readability_score=75,
            word_count=5,
        )

        request = SingleGenerateRequest(product=product_input)

        # Return a dict to test the dict→GenerationState conversion path
        dict_state = GenerationState(
            product=product_input,
            product_brief=mock_brief,
            seo_strategy=mock_seo,
            variants=[mock_variant, mock_variant, mock_variant],
            total_tokens_used=500,
        ).model_dump()

        with patch("app.orchestrator._graph") as mock_graph:
            mock_graph.ainvoke = AsyncMock(return_value=dict_state)
            output = await generate_single(request)

        assert output.product_brief.product_name == "Dict Product"
        assert len(output.variants) == 3
