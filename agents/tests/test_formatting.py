"""Tests for platform-specific formatting service."""

from app.services.formatting import (
    apply_platform_format,
    format_shopify,
    format_amazon,
    format_etsy,
    format_woocommerce,
    format_generic,
    _truncate,
)


class TestTruncate:
    def test_short_text_unchanged(self):
        assert _truncate("hello", 10) == "hello"

    def test_exact_length_unchanged(self):
        assert _truncate("hello", 5) == "hello"

    def test_long_text_truncated(self):
        result = _truncate("hello world foo bar", 12)
        assert len(result) <= 12
        assert result.endswith("…")

    def test_truncation_at_word_boundary(self):
        result = _truncate("one two three four five", 15)
        assert " " not in result[-1:]  # Should end at word boundary + ellipsis


class TestFormatShopify:
    def test_meta_title_truncated(self):
        variant = {"meta_title": "A" * 100, "meta_description": "short", "description": "text"}
        result = format_shopify(variant)
        assert len(result["meta_title"]) <= 70

    def test_meta_description_truncated(self):
        variant = {"meta_title": "title", "meta_description": "B" * 200, "description": "text"}
        result = format_shopify(variant)
        assert len(result["meta_description"]) <= 160

    def test_description_wrapped_in_html(self):
        variant = {
            "meta_title": "title",
            "meta_description": "desc",
            "description": "First paragraph\n\nSecond paragraph",
        }
        result = format_shopify(variant)
        assert "<p>" in result["description"]

    def test_already_html_description_untouched(self):
        html = "<p>Already HTML</p>"
        variant = {"meta_title": "t", "meta_description": "d", "description": html}
        result = format_shopify(variant)
        assert result["description"] == html


class TestFormatAmazon:
    def test_title_truncated_to_200(self):
        variant = {"title": "X" * 250, "meta_title": "X" * 250, "bullet_points": [], "description": "plain"}
        result = format_amazon(variant)
        assert len(result["title"]) <= 200

    def test_html_stripped_from_description(self):
        variant = {
            "title": "Product",
            "meta_title": "Product",
            "bullet_points": ["a", "b", "c", "d", "e"],
            "description": "<p>Hello</p> <b>world</b>",
        }
        result = format_amazon(variant)
        assert "<" not in result["description"]
        assert "Hello" in result["description"]

    def test_extra_bullets_trimmed(self):
        variant = {
            "title": "Product",
            "meta_title": "Product",
            "bullet_points": ["1", "2", "3", "4", "5", "6", "7"],
            "description": "desc",
        }
        result = format_amazon(variant)
        assert len(result["bullet_points"]) <= 5


class TestFormatEtsy:
    def test_title_truncated_to_140(self):
        variant = {"title": "Y" * 200, "keywords": [], "description": "text"}
        result = format_etsy(variant)
        assert len(result["title"]) <= 140

    def test_keywords_trimmed_to_13(self):
        variant = {"title": "Title", "keywords": [f"kw{i}" for i in range(20)], "description": "text"}
        result = format_etsy(variant)
        assert len(result["keywords"]) <= 13

    def test_html_stripped(self):
        variant = {"title": "Title", "keywords": [], "description": "<b>Bold</b> text"}
        result = format_etsy(variant)
        assert "<" not in result["description"]


class TestFormatWoocommerce:
    def test_meta_title_truncated_to_60(self):
        variant = {"meta_title": "Z" * 100, "meta_description": "short"}
        result = format_woocommerce(variant)
        assert len(result["meta_title"]) <= 60

    def test_meta_description_truncated_to_155(self):
        variant = {"meta_title": "title", "meta_description": "Z" * 200}
        result = format_woocommerce(variant)
        assert len(result["meta_description"]) <= 155


class TestFormatGeneric:
    def test_meta_title_truncated_to_60(self):
        variant = {"meta_title": "W" * 80, "meta_description": "short"}
        result = format_generic(variant)
        assert len(result["meta_title"]) <= 60


class TestApplyPlatformFormat:
    def test_dispatches_to_shopify(self):
        variant = {"meta_title": "A" * 100, "meta_description": "desc", "description": "text"}
        result = apply_platform_format("shopify", variant)
        assert len(result["meta_title"]) <= 70

    def test_dispatches_to_amazon(self):
        variant = {"title": "X" * 250, "meta_title": "X" * 250, "bullet_points": [], "description": "plain"}
        result = apply_platform_format("amazon", variant)
        assert len(result["title"]) <= 200

    def test_unknown_platform_uses_generic(self):
        variant = {"meta_title": "W" * 80, "meta_description": "short"}
        result = apply_platform_format("unknown_platform", variant)
        assert len(result["meta_title"]) <= 60
