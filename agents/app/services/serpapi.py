"""SerpAPI wrapper for keyword research and competitor listing data."""

import logging

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

SERPAPI_BASE = "https://serpapi.com/search.json"


async def search_keywords(query: str, *, gl: str = "us", num: int = 10) -> dict:
    """Run a Google search via SerpAPI and return the raw response."""
    if not settings.SERPAPI_KEY:
        logger.warning("SERPAPI_KEY not set — returning empty results")
        return {}

    params = {
        "q": query,
        "engine": "google",
        "gl": gl,
        "num": num,
        "api_key": settings.SERPAPI_KEY,
    }

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(SERPAPI_BASE, params=params)
        resp.raise_for_status()
        return resp.json()


async def search_shopping(query: str, *, gl: str = "us", num: int = 10) -> dict:
    """Run a Google Shopping search via SerpAPI."""
    if not settings.SERPAPI_KEY:
        logger.warning("SERPAPI_KEY not set — returning empty results")
        return {}

    params = {
        "q": query,
        "engine": "google_shopping",
        "gl": gl,
        "num": num,
        "api_key": settings.SERPAPI_KEY,
    }

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(SERPAPI_BASE, params=params)
        resp.raise_for_status()
        return resp.json()


def extract_competitor_listings(search_data: dict) -> list[dict]:
    """Extract competitor listings from SerpAPI organic results."""
    organic = search_data.get("organic_results", [])
    listings = []
    for result in organic[:5]:
        listings.append({
            "title": result.get("title", ""),
            "url": result.get("link"),
            "snippet": result.get("snippet", ""),
        })
    return listings


def extract_related_keywords(search_data: dict) -> list[str]:
    """Extract related search queries from SerpAPI results."""
    related = search_data.get("related_searches", [])
    return [r.get("query", "") for r in related if r.get("query")]
