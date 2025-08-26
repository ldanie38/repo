from pydantic import BaseModel
import os

class Settings(BaseModel):
    database_url: str = os.getenv("DATABASE_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/facrm")
    allowed_origins: str = os.getenv("ALLOWED_ORIGINS", "chrome-extension://*")
    connectwise_base_url: str = os.getenv("CONNECTWISE_BASE_URL", "https://example.test")
    connectwise_key: str = os.getenv("CONNECTWISE_KEY", "mock-key")
    connectwise_secret: str = os.getenv("CONNECTWISE_SECRET", "mock-secret")

settings = Settings()
