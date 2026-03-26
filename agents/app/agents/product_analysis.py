"""Product Analysis Agent — Agent 1 in the pipeline.

Analyses raw product data and produces a structured ProductBrief.
"""

import logging

from langchain_core.messages import SystemMessage, HumanMessage

from app.models.schemas import ProductInput, ProductBrief, GenerationState
from app.models.prompts import PRODUCT_ANALYSIS_SYSTEM, PRODUCT_ANALYSIS_USER
from app.services.llm import get_llm, invoke_structured

logger = logging.getLogger(__name__)


async def run_product_analysis(state: GenerationState) -> GenerationState:
    """LangGraph node: analyse the product and attach a ProductBrief to state."""
    product = state.product
    logger.info("Running product analysis for: %s", product.name)

    prompt = PRODUCT_ANALYSIS_USER.format(
        name=product.name,
        category=product.category or "Not specified",
        brand=product.brand or "Not specified",
        price=product.price or "Not specified",
        currency=product.currency,
        features=", ".join(product.features) if product.features else "None provided",
        raw_description=product.raw_description or "None provided",
        raw_data=str(product.raw_data) if product.raw_data else "None",
    )

    messages = [
        SystemMessage(content=PRODUCT_ANALYSIS_SYSTEM),
        HumanMessage(content=prompt),
    ]

    llm = get_llm(premium=False)
    brief, tokens = await invoke_structured(llm, ProductBrief, messages)

    state.product_brief = brief
    state.total_tokens_used += tokens
    logger.info("Product analysis complete — %d tokens", tokens)
    return state
