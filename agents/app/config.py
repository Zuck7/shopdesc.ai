from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    SERPAPI_KEY: str = ""
    REDIS_URL: str = "redis://localhost:6379"
    LOG_LEVEL: str = "info"


settings = Settings()
