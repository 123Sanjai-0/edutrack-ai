import os
from typing import List
from pydantic_settings import BaseSettings

def _parse_cors_origins() -> List[str]:
    """Parse CORS origins from env var (comma-separated) or use defaults."""
    env_val = os.getenv("CORS_ORIGINS", "")
    if env_val:
        return [o.strip() for o in env_val.split(",") if o.strip()]
    return [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*"
    ]

class Settings(BaseSettings):
    PROJECT_NAME: str = "EduTrack AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "edutrack_super_secret_jwt_key_2026_change_in_production_xyz123")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))  # 24 hours
    REFRESH_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_MINUTES", "10080"))  # 7 days
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./edutrack.db")
    
    # CORS
    CORS_ORIGINS: List[str] = _parse_cors_origins()
    
    # ML Models directory
    ML_MODELS_DIR: str = os.getenv("ML_MODELS_DIR", "./ml_models")
    
    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()

