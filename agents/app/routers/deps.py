from fastapi import Header, HTTPException, status

from app.config import settings


def verify_agent_api_key(
    x_agent_api_key: str | None = Header(default=None, alias="x-agent-api-key"),
) -> None:
    """Require a matching API key when AGENT_API_KEY is configured."""
    if not settings.AGENT_API_KEY:
        return

    if x_agent_api_key != settings.AGENT_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized agent request",
        )
