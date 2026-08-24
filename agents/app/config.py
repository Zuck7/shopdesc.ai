from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    SERPAPI_KEY: str = ""
    REDIS_URL: str = "redis://localhost:6379"
    LOG_LEVEL: str = "info"

    # LLM defaults
    OPENAI_MODEL: str = "gpt-4o-mini"
    OPENAI_MODEL_PREMIUM: str = "gpt-4o"
    ANTHROPIC_MODEL: str = "claude-3-5-sonnet-20241022"
    LLM_TEMPERATURE: float = 0.7
    LLM_MAX_RETRIES: int = 2

    # Agent service API key (for internal auth from Express)
    AGENT_API_KEY: str = ""

    # Comma-separated list of allowed browser origins for the agent service
    AGENT_CORS_ORIGINS: str = "http://localhost:5173,http://localhost:5000"


settings = Settings()
