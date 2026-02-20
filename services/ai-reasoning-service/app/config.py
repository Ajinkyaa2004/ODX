from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    """Application settings"""
    
    # Groq API
    groq_api_key: str = ""
    groq_model: str = "llama-3.1-70b-versatile"
    
    # MongoDB
    mongodb_uri: str = "mongodb://localhost:27017"
    mongodb_database: str = "intraday_decision"
    
    # Cache settings
    cache_ttl_minutes: int = 5
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
