import pytest

from app.models.schemas import (
    ProductInput,
    ProductBrief,
    SEOStrategy,
    Keyword,
    CompetitorAnalysis,
    CompetitorListing,
    ContentVariant,
    CopywritingOutput,
    GenerationState,
    Platform,
    Tone,
)


@pytest.fixture
def sample_product():
    return {
        "name": "Organic Cotton T-Shirt",
        "category": "Clothing",
        "features": ["100% organic cotton", "Breathable", "Machine washable"],
        "price": 29.99,
        "currency": "USD",
        "brand": "EcoWear",
    }


@pytest.fixture
def product_input():
    return ProductInput(
        name="Organic Cotton T-Shirt",
        category="Clothing",
        features=["100% organic cotton", "Breathable", "Machine washable"],
        price=29.99,
        currency="USD",
        brand="EcoWear",
        raw_description="A soft, breathable t-shirt made from 100% organic cotton.",
    )


@pytest.fixture
def product_brief():
    return ProductBrief(
        product_name="Organic Cotton T-Shirt",
        product_type="T-Shirt",
        category="Clothing",
        subcategory="T-Shirts",
        core_features=["100% organic cotton", "Breathable fabric", "Machine washable"],
        key_benefits=["Eco-friendly", "Comfortable all day", "Easy care"],
        target_audience="Eco-conscious consumers aged 25-40",
        use_cases=["Casual wear", "Outdoor activities", "Layering"],
        unique_selling_points=["Certified organic cotton", "Sustainable manufacturing"],
        price_positioning="mid-range",
        emotional_triggers=["sustainability", "comfort", "guilt-free fashion"],
    )


@pytest.fixture
def seo_strategy():
    return SEOStrategy(
        primary_keyword=Keyword(term="organic cotton t-shirt", relevance=0.95, keyword_type="primary"),
        secondary_keywords=[
            Keyword(term="eco friendly shirt", relevance=0.8, keyword_type="secondary"),
            Keyword(term="sustainable clothing", relevance=0.75, keyword_type="secondary"),
        ],
        long_tail_keywords=[
            Keyword(term="organic cotton t-shirt for men", relevance=0.7, keyword_type="long-tail"),
        ],
        target_word_count=200,
        target_keyword_density=2.0,
        meta_title_max_length=60,
        meta_description_max_length=155,
        platform_specific_notes="Optimise for Shopify search and Google Shopping.",
        search_intent="transactional",
    )


@pytest.fixture
def competitor_analysis():
    return CompetitorAnalysis(
        top_competitors=[
            CompetitorListing(
                title="Premium Organic Tee",
                url="https://example.com/tee",
                platform="shopify",
                strengths=["Strong branding", "Detailed sizing"],
                weaknesses=["High price", "Limited colours"],
            )
        ],
        common_keywords=["organic cotton", "sustainable", "eco-friendly"],
        content_gaps=["No mention of certifications", "Missing care instructions"],
        differentiation_suggestions=["Highlight GOTS certification", "Add lifestyle imagery"],
        average_title_length=55,
        average_description_length=180,
    )


@pytest.fixture
def content_variant():
    return ContentVariant(
        variant_label="A",
        title="Organic Cotton T-Shirt — Eco-Friendly Comfort",
        description=(
            "Discover our organic cotton t-shirt made from 100% certified organic cotton. "
            "This eco friendly shirt offers all-day comfort with breathable fabric that's gentle "
            "on your skin and the planet. Perfect for sustainable clothing enthusiasts who want "
            "style without compromise. Machine washable for easy care. "
            "Our organic cotton t-shirt is the perfect choice for eco-conscious consumers."
        ),
        meta_title="Organic Cotton T-Shirt | EcoWear Sustainable Clothing",
        meta_description=(
            "Shop our organic cotton t-shirt made from certified organic cotton. "
            "Breathable, comfortable, and eco-friendly. Free shipping on orders over $50."
        ),
        keywords=["organic cotton t-shirt", "eco friendly shirt", "sustainable clothing"],
        bullet_points=[
            "100% certified organic cotton",
            "Breathable and comfortable all day",
            "Machine washable for easy care",
            "Eco-friendly sustainable fashion",
            "Available in multiple sizes",
        ],
        seo_score=85,
        readability_score=72,
        word_count=65,
    )


@pytest.fixture
def generation_state(product_input):
    return GenerationState(
        product=product_input,
        platform=Platform.SHOPIFY,
        tone=Tone.PROFESSIONAL,
    )
