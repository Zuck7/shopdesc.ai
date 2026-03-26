"""SEO score and readability score calculators."""

import re
import math


def calculate_seo_score(
    text: str,
    title: str,
    meta_title: str,
    meta_description: str,
    primary_keyword: str,
    secondary_keywords: list[str],
) -> int:
    """Calculate a 0-100 SEO score based on keyword usage and formatting."""
    score = 0
    pk_lower = primary_keyword.lower()

    # Primary keyword in title (20 pts)
    if pk_lower in title.lower():
        score += 20

    # Primary keyword in meta title (10 pts)
    if pk_lower in meta_title.lower():
        score += 10

    # Primary keyword in meta description (10 pts)
    if pk_lower in meta_description.lower():
        score += 10

    # Primary keyword in first 100 chars of description (10 pts)
    if pk_lower in text[:100].lower():
        score += 10

    # Keyword density 1-3% (15 pts)
    word_count = len(text.split())
    if word_count > 0:
        pk_count = text.lower().count(pk_lower)
        density = (pk_count / word_count) * 100
        if 1.0 <= density <= 3.0:
            score += 15
        elif 0.5 <= density < 1.0 or 3.0 < density <= 4.0:
            score += 8

    # Secondary keywords present (up to 15 pts)
    sk_found = sum(1 for sk in secondary_keywords if sk.lower() in text.lower())
    if secondary_keywords:
        score += min(15, int(15 * sk_found / len(secondary_keywords)))

    # Meta title length 30-60 chars (5 pts)
    if 30 <= len(meta_title) <= 70:
        score += 5

    # Meta description length 120-160 chars (5 pts)
    if 120 <= len(meta_description) <= 160:
        score += 5

    # Word count adequate (10 pts) — at least 100 words
    if word_count >= 100:
        score += 10
    elif word_count >= 50:
        score += 5

    return min(100, score)


def calculate_readability_score(text: str) -> int:
    """Calculate a 0-100 readability score (simplified Flesch-like)."""
    sentences = re.split(r"[.!?]+", text)
    sentences = [s.strip() for s in sentences if s.strip()]
    words = text.split()
    if not words or not sentences:
        return 50

    avg_sentence_length = len(words) / len(sentences)
    # Count syllables (rough approximation)
    syllable_count = sum(_count_syllables(w) for w in words)
    avg_syllables = syllable_count / len(words)

    # Simplified Flesch Reading Ease
    flesch = 206.835 - (1.015 * avg_sentence_length) - (84.6 * avg_syllables)

    # Clamp and normalise to 0-100
    return max(0, min(100, int(flesch)))


def _count_syllables(word: str) -> int:
    """Rough syllable count for English words."""
    word = word.lower().strip(".,!?;:'\"")
    if not word:
        return 1
    count = 0
    vowels = "aeiouy"
    prev_vowel = False
    for char in word:
        is_vowel = char in vowels
        if is_vowel and not prev_vowel:
            count += 1
        prev_vowel = is_vowel
    # Silent e
    if word.endswith("e") and count > 1:
        count -= 1
    return max(1, count)
