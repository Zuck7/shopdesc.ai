"""Tests for Pydantic schemas — validation, defaults, enums."""

import pytest
from pydantic import ValidationError

from app.models.schemas import (
    ProductInput,
    ProductBrief,
    SEOStrategy,
    Keyword,
    ContentVariant,
    CopywritingOutput,
    CompetitorAnalysis,
    CompetitorListing,
    GenerationState,
    Platform,
    Tone,
    SingleGenerateRequest,
)


class TestProductInput:
    def test_valid_product(self, sample_product):
        p = ProductInput(**sample_product)
        assert p.name == "Organic Cotton T-Shirt"
        assert p.currency == "USD"

    def test_defaults(self):
        p = ProductInput(name="Widget")
        assert p.category is None
        assert p.features == []
        assert p.images == []
        assert p.currency == "USD"
        assert p.raw_data is None

    def test_name_required(self):
        with pytest.raises(ValidationError):
            ProductInput()


class TestProductBrief:
    def test_valid_brief(self, product_brief):
        assert product_brief.product_name == "Organic Cotton T-Shirt"
        assert len(product_brief.core_features) == 3

    def test_core_features_min_length(self):
        with pytest.raises(ValidationError):
            ProductBrief(
                product_name="X",
                product_type="T",
                category="C",
                core_features=[],
                key_benefits=["b"],
                target_audience="all",
                use_cases=["casual"],
                unique_selling_points=["unique"],
                price_positioning="budget",
                emotional_triggers=["comfort"],
            )


class TestKeyword:
    def test_relevance_bounds(self):
        k = Keyword(term="test", relevance=0.5, keyword_type="primary")
        assert k.relevance == 0.5

    def test_relevance_out_of_bounds(self):
        with pytest.raises(ValidationError):
            Keyword(term="test", relevance=1.5, keyword_type="primary")


class TestContentVariant:
    def test_seo_score_bounds(self):
        with pytest.raises(ValidationError):
            ContentVariant(
                variant_label="A",
                title="T",
                description="D",
                meta_title="MT",
                meta_description="MD",
                keywords=[],
                bullet_points=[],
                seo_score=150,
                readability_score=50,
                word_count=10,
            )


class TestCopywritingOutput:
    def test_requires_exactly_3_variants(self, content_variant):
        with pytest.raises(ValidationError):
            CopywritingOutput(variants=[content_variant])


class TestPlatformEnum:
    def test_all_platforms(self):
        assert Platform.SHOPIFY.value == "shopify"
        assert Platform.AMAZON.value == "amazon"
        assert Platform.ETSY.value == "etsy"
        assert Platform.WOOCOMMERCE.value == "woocommerce"
        assert Platform.GENERIC.value == "generic"


class TestToneEnum:
    def test_all_tones(self):
        assert Tone.PROFESSIONAL.value == "professional"
        assert Tone.CASUAL.value == "casual"
        assert Tone.LUXURY.value == "luxury"
        assert Tone.PLAYFUL.value == "playful"
        assert Tone.CUSTOM.value == "custom"


class TestGenerationState:
    def test_defaults(self, product_input):
        state = GenerationState(product=product_input)
        assert state.platform == Platform.GENERIC
        assert state.tone == Tone.PROFESSIONAL
        assert state.total_tokens_used == 0
        assert state.errors == []
        assert state.variants == []

    def test_populated_state(self, product_input, product_brief, seo_strategy):
        state = GenerationState(
            product=product_input,
            platform=Platform.SHOPIFY,
            tone=Tone.CASUAL,
            product_brief=product_brief,
            seo_strategy=seo_strategy,
        )
        assert state.product_brief.product_name == "Organic Cotton T-Shirt"
        assert state.seo_strategy.primary_keyword.term == "organic cotton t-shirt"


class TestSingleGenerateRequest:
    def test_valid_request(self, sample_product):
        req = SingleGenerateRequest(
            product=ProductInput(**sample_product),
            platform=Platform.AMAZON,
            tone=Tone.LUXURY,
        )
        assert req.platform == Platform.AMAZON
        assert req.include_competitor_analysis is False
