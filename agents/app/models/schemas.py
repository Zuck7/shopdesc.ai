from pydantic import BaseModel, Field
from enum import Enum
from typing import Optional


class Platform(str, Enum):
    SHOPIFY = "shopify"
    AMAZON = "amazon"
    ETSY = "etsy"
    WOOCOMMERCE = "woocommerce"
    GENERIC = "generic"


class Tone(str, Enum):
    PROFESSIONAL = "professional"
    CASUAL = "casual"
    LUXURY = "luxury"
    PLAYFUL = "playful"
    CUSTOM = "custom"


# ── Agent 1: Product Analysis ──


class ProductInput(BaseModel):
    """Raw product data from the user"""

    name: str
    category: str | None = None
    features: list[str] = Field(default_factory=list)
    price: float | None = None
    currency: str = "USD"
    brand: str | None = None
    images: list[str] = Field(default_factory=list)
    raw_description: str | None = None
    raw_data: dict | None = None


class ProductBrief(BaseModel):
    """Structured output from Product Analysis Agent"""

    product_name: str
    product_type: str
    category: str
    subcategory: str | None = None
    core_features: list[str] = Field(min_length=1, max_length=10)
    key_benefits: list[str] = Field(min_length=1, max_length=10)
    target_audience: str
    use_cases: list[str]
    unique_selling_points: list[str]
    price_positioning: str  # "budget", "mid-range", "premium", "luxury"
    emotional_triggers: list[str]


# ── Agent 2: SEO ──


class Keyword(BaseModel):
    term: str
    search_volume: int | None = None
    difficulty: int | None = None
    relevance: float = Field(ge=0, le=1)
    keyword_type: str  # "primary", "secondary", "long-tail"


class SEOStrategy(BaseModel):
    """Structured output from SEO Agent"""

    primary_keyword: Keyword
    secondary_keywords: list[Keyword]
    long_tail_keywords: list[Keyword]
    target_word_count: int
    target_keyword_density: float
    meta_title_max_length: int
    meta_description_max_length: int
    platform_specific_notes: str
    search_intent: str  # "transactional", "informational", "navigational"


# ── Agent 3: Copywriting ──


class ContentVariant(BaseModel):
    """A single generated variant"""

    variant_label: str  # "A", "B", "C"
    title: str
    description: str
    meta_title: str
    meta_description: str
    keywords: list[str]
    bullet_points: list[str]
    seo_score: int = Field(ge=0, le=100)
    readability_score: int = Field(ge=0, le=100)
    word_count: int


class CopywritingOutput(BaseModel):
    """Structured output from copywriting agent — 3 variants"""

    variants: list[ContentVariant] = Field(min_length=3, max_length=3)


# ── Agent 4: Competitor ──


class CompetitorListing(BaseModel):
    title: str
    url: str | None = None
    platform: str
    strengths: list[str]
    weaknesses: list[str]


class CompetitorAnalysis(BaseModel):
    """Structured output from Competitor Agent"""

    top_competitors: list[CompetitorListing]
    common_keywords: list[str]
    content_gaps: list[str]
    differentiation_suggestions: list[str]
    average_title_length: int
    average_description_length: int


# ── Generation State (LangGraph) ──


class GenerationState(BaseModel):
    """Shared state flowing through the LangGraph pipeline"""

    product: ProductInput
    platform: Platform = Platform.GENERIC
    tone: Tone = Tone.PROFESSIONAL
    custom_tone_instructions: str | None = None
    include_competitor_analysis: bool = False

    # Filled by agents
    product_brief: ProductBrief | None = None
    seo_strategy: SEOStrategy | None = None
    competitor_analysis: CompetitorAnalysis | None = None
    variants: list[ContentVariant] = Field(default_factory=list)

    # Metadata
    total_tokens_used: int = 0
    processing_time_ms: int = 0
    errors: list[str] = Field(default_factory=list)


# ── API Request / Response ──


class SingleGenerateRequest(BaseModel):
    product: ProductInput
    platform: Platform = Platform.GENERIC
    tone: Tone = Tone.PROFESSIONAL
    custom_tone_instructions: str | None = None
    include_competitor_analysis: bool = False


class GenerationOutput(BaseModel):
    """Final combined output from the pipeline"""

    product_brief: ProductBrief
    seo_strategy: SEOStrategy
    variants: list[ContentVariant] = Field(min_length=3, max_length=3)
    competitor_analysis: CompetitorAnalysis | None = None
    total_tokens_used: int
    processing_time_ms: int


class HealthResponse(BaseModel):
    status: str = "healthy"
    agents: list[str] = [
        "product_analysis",
        "seo",
        "copywriting",
        "competitor",
    ]
    version: str


class BulkGenerateRequest(BaseModel):
    products: list[ProductInput]
    platform: Platform = Platform.GENERIC
    tone: Tone = Tone.PROFESSIONAL
    custom_tone_instructions: str | None = None
    include_competitor_analysis: bool = False
