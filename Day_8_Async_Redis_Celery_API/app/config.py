from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    redis_url: str = "redis://localhost:6379/0"
    cache_ttl: int = 60
    rate_limit_requests: int = 10
    rate_limit_window: int = 60
    celery_broker_url: str = "redis://localhost:6379/1"
    celery_result_backend: str = "redis://localhost:6379/2"
    allowed_origins: str = "http://localhost:3000,http://localhost:5173"
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
