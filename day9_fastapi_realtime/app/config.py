from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Day 9 FastAPI Realtime Notifications"
    upload_dir: Path = Path("uploads")
    max_upload_size: int = 5 * 1024 * 1024
    max_image_width: int = 1600
    max_image_height: int = 1600
    allowed_image_types: tuple[str, ...] = ("image/jpeg", "image/png", "image/webp")

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
