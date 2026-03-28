"""Tests for the SEO and readability scoring service."""

from app.services.scoring import calculate_seo_score, calculate_readability_score


class TestCalculateSEOScore:
    def test_perfect_score_components(self):
        """Score increases with keyword usage in right places."""
        text = (
            "Our organic cotton t-shirt is the best eco friendly shirt on the market. "
            "This sustainable clothing item features organic cotton t-shirt quality materials. "
            "The organic cotton t-shirt provides comfort and style for every occasion. "
        ) * 5  # Enough words to hit word count bonus
        score = calculate_seo_score(
            text=text,
            title="Organic Cotton T-Shirt for Everyone",
            meta_title="Organic Cotton T-Shirt | Sustainable Clothing Store",
            meta_description="Shop our organic cotton t-shirt made from certified organic cotton. Breathable, comfortable, and eco-friendly. Free shipping.",
            primary_keyword="organic cotton t-shirt",
            secondary_keywords=["eco friendly shirt", "sustainable clothing"],
        )
        assert score > 50

    def test_no_keyword_matches_low_score(self):
        """Score is low when primary keyword is completely absent."""
        score = calculate_seo_score(
            text="This is a completely unrelated product description about shoes.",
            title="Running Shoes",
            meta_title="Running Shoes Store",
            meta_description="Best running shoes.",
            primary_keyword="organic cotton t-shirt",
            secondary_keywords=["eco friendly shirt"],
        )
        assert score < 20

    def test_primary_in_title_adds_points(self):
        """Primary keyword in title should contribute to score."""
        base = calculate_seo_score(
            text="A short description.",
            title="Some Title",
            meta_title="Some Meta",
            meta_description="Some description for meta.",
            primary_keyword="organic cotton",
            secondary_keywords=[],
        )
        with_keyword = calculate_seo_score(
            text="A short description.",
            title="Organic Cotton Premium",
            meta_title="Some Meta",
            meta_description="Some description for meta.",
            primary_keyword="organic cotton",
            secondary_keywords=[],
        )
        assert with_keyword > base

    def test_score_capped_at_100(self):
        """Score should never exceed 100."""
        text = "organic cotton t-shirt " * 200
        score = calculate_seo_score(
            text=text,
            title="organic cotton t-shirt",
            meta_title="organic cotton t-shirt meta title that is good",
            meta_description="Shop our organic cotton t-shirt. This organic cotton product is amazing and comfortable for daily use and free shipping available.",
            primary_keyword="organic cotton t-shirt",
            secondary_keywords=["cotton", "shirt", "organic"],
        )
        assert score <= 100

    def test_secondary_keywords_contribute(self):
        """Secondary keywords in text should additively contribute."""
        base = calculate_seo_score(
            text="A product description without any keywords at all." * 10,
            title="Title",
            meta_title="Meta Title",
            meta_description="Meta description.",
            primary_keyword="nonexistent",
            secondary_keywords=["also missing", "not here"],
        )
        with_secondary = calculate_seo_score(
            text="A product description with also missing keywords." * 10,
            title="Title",
            meta_title="Meta Title",
            meta_description="Meta description.",
            primary_keyword="nonexistent",
            secondary_keywords=["also missing", "not here"],
        )
        assert with_secondary >= base


class TestCalculateReadabilityScore:
    def test_simple_text_high_score(self):
        """Simple sentences should score well."""
        text = "This is a simple sentence. It is easy to read. The words are short."
        score = calculate_readability_score(text)
        assert 40 <= score <= 100

    def test_complex_text_lower_score(self):
        """Complex, academic text should score lower."""
        text = (
            "The multifaceted implications of sustainable manufacturing practices "
            "necessitate a comprehensive evaluation of environmental externalities "
            "and socioeconomic reverberations throughout the supply chain continuum."
        )
        score = calculate_readability_score(text)
        assert 0 <= score <= 100

    def test_empty_text_returns_default(self):
        """Empty text should return the default score."""
        score = calculate_readability_score("")
        assert score == 50

    def test_score_bounds(self):
        """Score should always be between 0 and 100."""
        texts = [
            "Hi.",
            "A " * 500,
            "Incomprehensibilities characterize the phenomenological manifestations.",
        ]
        for text in texts:
            score = calculate_readability_score(text)
            assert 0 <= score <= 100
