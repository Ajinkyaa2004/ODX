from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    """Application settings"""
    
    # MongoDB
    mongodb_uri: str = "mongodb://localhost:27017"
    mongodb_database: str = "intraday_decision"
    
    # Evaluation
    evaluation_interval_minutes: int = 3
    
    # Scoring Thresholds
    conservative_setup_threshold: float = 8.0
    conservative_no_trade_threshold: float = 4.0
    balanced_setup_threshold: float = 7.0
    balanced_no_trade_threshold: float = 6.0
    aggressive_setup_threshold: float = 6.0
    aggressive_no_trade_threshold: float = 7.0
    
    # Market Hours (IST)
    market_start_time: str = "09:15"
    market_end_time: str = "15:30"
    market_timezone: str = "Asia/Kolkata"
    
    # AI Service
    ai_reasoning_service_url: Optional[str] = "http://localhost:8002"
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
