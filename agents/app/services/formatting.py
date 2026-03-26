"""Post-generation platform formatters.

Validate and enforce platform-specific constraints on generated content variants.
"""


def _truncate(text: str, max_len: int) -> str:
    if len(text) <= max_len:
        return text
    return text[: max_len - 1].rsplit(" ", 1)[0] + "…"


def format_shopify(variant: dict) -> dict:
    """Shopify: HTML description, SEO title ≤70, meta ≤160."""
    variant["meta_title"] = _truncate(variant.get("meta_title", ""), 70)
    variant["meta_description"] = _truncate(variant.get("meta_description", ""), 160)
    # Wrap description in basic HTML if not already
    desc = variant.get("description", "")
    if desc and not desc.strip().startswith("<"):
        paragraphs = [p.strip() for p in desc.split("\n\n") if p.strip()]
        variant["description"] = "\n".join(f"<p>{p}</p>" for p in paragraphs)
    return variant


def format_amazon(variant: dict) -> dict:
    """Amazon: title ≤200, exactly 5 bullet points, plain text."""
    variant["title"] = _truncate(variant.get("title", ""), 200)
    variant["meta_title"] = _truncate(variant.get("meta_title", ""), 200)
    # Enforce exactly 5 bullet points
    bullets = variant.get("bullet_points", [])
    if len(bullets) > 5:
        bullets = bullets[:5]
    while len(bullets) < 5:
        bullets.append("")
    variant["bullet_points"] = [b for b in bullets if b]  # keep non-empty, up to 5
    # Strip HTML tags from description
    desc = variant.get("description", "")
    if "<" in desc:
        import re
        variant["description"] = re.sub(r"<[^>]+>", "", desc)
    return variant


def format_etsy(variant: dict) -> dict:
    """Etsy: title ≤140, max 13 tags, plain text."""
    variant["title"] = _truncate(variant.get("title", ""), 140)
    keywords = variant.get("keywords", [])
    if len(keywords) > 13:
        variant["keywords"] = keywords[:13]
    # Strip HTML
    desc = variant.get("description", "")
    if "<" in desc:
        import re
        variant["description"] = re.sub(r"<[^>]+>", "", desc)
    return variant


def format_woocommerce(variant: dict) -> dict:
    """WooCommerce: SEO title ≤60, meta ≤155, HTML supported."""
    variant["meta_title"] = _truncate(variant.get("meta_title", ""), 60)
    variant["meta_description"] = _truncate(variant.get("meta_description", ""), 155)
    return variant


def format_generic(variant: dict) -> dict:
    """Generic: SEO title ≤60, meta ≤155, plain text."""
    variant["meta_title"] = _truncate(variant.get("meta_title", ""), 60)
    variant["meta_description"] = _truncate(variant.get("meta_description", ""), 155)
    return variant


FORMATTERS = {
    "shopify": format_shopify,
    "amazon": format_amazon,
    "etsy": format_etsy,
    "woocommerce": format_woocommerce,
    "generic": format_generic,
}


def apply_platform_format(platform: str, variant: dict) -> dict:
    """Apply platform-specific formatting to a content variant dict."""
    formatter = FORMATTERS.get(platform, format_generic)
    return formatter(variant)
