import pytest
from app.models.schemas import (
    ProductInput,
    ProductBrief,
    SEOStrategy,
    Keyword,
    ContentVariant,
    CompetitorAnalysis,
    CompetitorListing,
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
def product_input(sample_product):
    return ProductInput(**sample_product)


@pytest.fixture
def product_brief():
    return ProductBrief(
        product_name="Organic Cotton T-Shirt",
        product_type="T-Shirt",
        category="Clothing",
        subcategory="Casual Wear",
        core_features=["100% organic cotton", "Breathable", "Machine washable"],
        key_benefits=["Eco-friendly", "Comfortable", "Durable"],
        target_audience="Environmentally conscious consumers aged 25-45",
        use_cases=["Casual wear", "Everyday use", "Eco-fashion"],
        unique_selling_points=["Certified organic", "Sustainable manufacturing"],
        price_positioning="mid-range",
        emotional_triggers=["sustainability", "comfort", "guilt-free shopping"],
    )


@pytest.fixture
def seo_strategy():
    return SEOStrategy(
        primary_keyword=Keyword(
            term="organic cotton t-shirt",
            search_volume=12000,
            difficulty=45,
            relevance=0.95,
            keyword_type="primary",
        ),
        secondary_keywords=[
            Keyword(term="eco friendly shirt", relevance=0.8, keyword_type="secondary"),
            Keyword(term="sustainable clothing", relevance=0.75, keyword_type="secondary"),
        ],
        long_tail_keywords=[
            Keyword(
                term="organic cotton t-shirt for men",
                relevance=0.7,
                keyword_type="long-tail",
            ),
        ],
        target_word_count=150,
        target_keyword_density=2.0,
        meta_title_max_length=60,
        meta_description_max_length=155,
        platform_specific_notes="Focus on product features in title",
        search_intent="transactional",
    )


@pytest.fixture
def content_variant():
    return ContentVariant(
        variant_label="A",
        title="Premium Organic Cotton T-Shirt | EcoWear",
        description="Discover our premium organic cotton t-shirt, crafted for comfort and sustainability.",
        meta_title="Organic Cotton T-Shirt | EcoWear Store",
        meta_description="Shop our organic cotton t-shirt. Made from certified organic cotton. Breathable and eco-friendly.",
        keywords=["organic cotton t-shirt", "eco friendly shirt"],
        bullet_points=["100% organic cotton", "Breathable fabric", "Machine washable"],
        seo_score=75,
        readability_score=80,
        word_count=15,
    )


@pytest.fixture
def competitor_analysis():
    return CompetitorAnalysis(
        top_competitors=[
            CompetitorListing(
                title="Rival Organic Tee",
                url="https://rival.com/tee",
                platform="shopify",
                strengths=["Good SEO", "Strong branding"],
                weaknesses=["High price", "Limited sizes"],
            ),
        ],
        common_keywords=["organic cotton", "sustainable shirt"],
        content_gaps=["No mention of certifications", "Missing care instructions"],
        differentiation_suggestions=["Highlight GOTS certification", "Add size guide"],
        average_title_length=50,
        average_description_length=200,
    )
