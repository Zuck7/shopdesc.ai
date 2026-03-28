"""LangGraph orchestrator — wires all 4 agents with conditional edges.

Pipeline: ProductAnalysis → SEO → (optional Competitor) → Copywriting
"""

import logging
import time
from typing import Annotated

from langgraph.graph import StateGraph, END

from app.models.schemas import (
    GenerationState,
    GenerationOutput,
    SingleGenerateRequest,
)
from app.agents.product_analysis import run_product_analysis
from app.agents.seo import run_seo_agent
from app.agents.copywriting import run_copywriting_agent
from app.agents.competitor import run_competitor_agent

logger = logging.getLogger(__name__)


# ── Conditional edge: should we run competitor analysis? ──

def should_analyze_competitors(state: GenerationState) -> str:
    if state.include_competitor_analysis:
        return "competitor_research"
    return "copywriting"


# ── Build the graph ──

def build_graph() -> StateGraph:
    workflow = StateGraph(GenerationState)

    workflow.add_node("product_analysis", run_product_analysis)
    workflow.add_node("seo_research", run_seo_agent)
    workflow.add_node("competitor_research", run_competitor_agent)
    workflow.add_node("copywriting", run_copywriting_agent)

    workflow.set_entry_point("product_analysis")
    workflow.add_edge("product_analysis", "seo_research")

    workflow.add_conditional_edges(
        "seo_research",
        should_analyze_competitors,
        {
            "competitor_research": "competitor_research",
            "copywriting": "copywriting",
        },
    )
    workflow.add_edge("competitor_research", "copywriting")
    workflow.add_edge("copywriting", END)

    return workflow


# Compile once at module level
_graph = build_graph().compile()


async def generate_single(request: SingleGenerateRequest) -> GenerationOutput:
    """Run the full agent pipeline for a single product."""
    start = time.time()

    initial_state = GenerationState(
        product=request.product,
        platform=request.platform,
        tone=request.tone,
        custom_tone_instructions=request.custom_tone_instructions,
        include_competitor_analysis=request.include_competitor_analysis,
    )

    logger.info(
        "Starting generation pipeline for '%s' on %s",
        request.product.name,
        request.platform.value,
    )

    # Run the graph
    final_state = await _graph.ainvoke(initial_state)

    # Handle dict or GenerationState return
    if isinstance(final_state, dict):
        final_state = GenerationState(**final_state)

    elapsed_ms = int((time.time() - start) * 1000)

    if final_state.errors:
        logger.warning("Pipeline completed with errors: %s", final_state.errors)

    if not final_state.product_brief or not final_state.seo_strategy or not final_state.variants:
        raise RuntimeError(
            f"Pipeline incomplete — errors: {final_state.errors}"
        )

    output = GenerationOutput(
        product_id=request.product.name,  # Use product name as ID if no explicit ID
        platform=request.platform,
        tone=request.tone,
        product_brief=final_state.product_brief,
        seo_strategy=final_state.seo_strategy,
        variants=final_state.variants,
        competitor_analysis=final_state.competitor_analysis,
        total_tokens_used=final_state.total_tokens_used,
        processing_time_ms=elapsed_ms,
    )

    logger.info(
        "Pipeline complete in %dms — %d tokens used",
        elapsed_ms,
        output.total_tokens_used,
    )

    return output
