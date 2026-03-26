import logging

from fastapi import APIRouter, HTTPException

from app.models.schemas import SingleGenerateRequest, GenerationOutput
from app.orchestrator import generate_single

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/single", response_model=GenerationOutput)
async def generate_single_endpoint(request: SingleGenerateRequest):
    """Generate content for a single product through the full agent pipeline."""
    try:
        result = await generate_single(request)
        return result
    except RuntimeError as exc:
        logger.error("Generation pipeline failed: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))
    except Exception as exc:
        logger.exception("Unexpected error in generation pipeline")
        raise HTTPException(status_code=500, detail="Generation failed")
