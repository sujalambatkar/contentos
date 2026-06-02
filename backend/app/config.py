from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    app_name: str = "ContentOS"
    debug: bool = False
    secret_key: str = "changeme-in-production-use-32-char-secret"
    algorithm: str = "HS256"
    access_token_expire_days: int = 7

    # Groq
    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"

    # HuggingFace
    hf_api_key: str = ""
    hf_embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"

    # MongoDB
    mongodb_uri: str = "mongodb://localhost:27017"
    mongodb_db: str = "contentos"

    # Upstash Redis
    upstash_redis_rest_url: str = ""
    upstash_redis_rest_token: str = ""

    # ChromaDB
    chroma_path: str = "/data/chroma"

    # Uploads
    upload_dir: str = "/uploads"

    # CORS
    allowed_origins: list[str] = ["http://localhost:3000", "https://*.vercel.app"]

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()
