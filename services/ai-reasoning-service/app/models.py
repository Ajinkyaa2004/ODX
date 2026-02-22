from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime

class EvaluationInput(BaseModel):
    """Input data for generating AI reasoning"""
    symbol: str = Field(..., description="Trading symbol (NIFTY/BANKNIFTY)")
    setup_score: float = Field(..., ge=0, le=10, description="Overall setup score")
    no_trade_score: float = Field(..., ge=0, le=10, description="No-trade risk score")
    decision: str = Field(..., description="Trading decision (TRADE/NO_TRADE)")
    threshold: float = Field(..., description="Setup score threshold")
    no_trade_threshold: float = Field(..., description="No-trade threshold")
    
    # Component scores
    trend_score: float = Field(..., ge=0, le=10)
    trend_direction: str = Field(..., description="BULLISH/BEARISH/NEUTRAL")
    
    vwap_score: float = Field(..., ge=0, le=10)
    vwap_status: str = Field(..., description="Above/Below VWAP")
    
    structure_score: float = Field(..., ge=0, le=10)
    
    oi_score: float = Field(..., ge=0, le=10)
    oi_pattern: str = Field(..., description="OI pattern description")
    
    volatility_score: float = Field(..., ge=0, le=10)
    volatility_regime: str = Field(..., description="LOW/MODERATE/HIGH")
    
    momentum_score: float = Field(..., ge=0, le=10)
    internal_score: float = Field(..., ge=0, le=10)
    
    # Advanced filters
    time_risk: str = Field(..., description="Time window risk assessment")
    fake_breakout_risk: str = Field(..., description="Fake breakout assessment")
    
    # Strike recommendation
    recommended_strike: Optional[float] = None
    option_type: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "symbol": "NIFTY",
                "setup_score": 7.5,
                "no_trade_score": 3.2,
                "decision": "TRADE",
                "threshold": 6.5,
                "no_trade_threshold": 5.0,
                "trend_score": 8.5,
                "trend_direction": "BULLISH",
                "vwap_score": 7.0,
                "vwap_status": "Above VWAP",
                "structure_score": 7.5,
                "oi_score": 8.0,
                "oi_pattern": "Call buying at support",
                "volatility_score": 6.5,
                "volatility_regime": "MODERATE",
                "momentum_score": 7.8,
                "internal_score": 7.2,
                "time_risk": "PRIME_TIME",
                "fake_breakout_risk": "LOW",
                "recommended_strike": 22450,
                "option_type": "CALL"
            }
        }


class AIReasoning(BaseModel):
    """AI-generated reasoning output"""
    trade_reasoning: str = Field(..., description="Main trade reasoning (2-3 sentences)")
    key_strengths: List[str] = Field(..., description="2-3 key strengths")
    key_risks: List[str] = Field(..., description="2-3 key risks")
    invalidation_condition: str = Field(..., description="Setup invalidation condition")
    confidence_level: Literal["HIGH", "MEDIUM", "LOW"] = Field(..., description="Confidence level")
    suggested_action: str = Field(..., description="Suggested action for trader")
    generated_at: datetime = Field(default_factory=datetime.utcnow)
    model: str = Field(default="llama-3.1-70b-versatile")
    generation_time_ms: Optional[int] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "trade_reasoning": "The setup shows strong bullish alignment with EMA slopes positive on both 5m and 15m timeframes. VWAP support is holding, and OI data confirms call buying at key support levels.",
                "key_strengths": [
                    "Multi-timeframe EMA alignment (5m + 15m)",
                    "Strong OI confirmation at support",
                    "Trading in prime time window"
                ],
                "key_risks": [
                    "Approaching resistance zone at 22480",
                    "Moderate chop detected in recent candles",
                    "Volume slightly below average"
                ],
                "invalidation_condition": "Price breaks below VWAP (22445) with increasing volume",
                "confidence_level": "HIGH",
                "suggested_action": "Consider CALL entry at 22450 strike with tight stop below VWAP"
            }
        }


class ReasoningResponse(BaseModel):
    """API response with reasoning"""
    success: bool
    reasoning: Optional[AIReasoning] = None
    error: Optional[str] = None
    cached: bool = False


class ReasoningRequest(BaseModel):
    """API request for generating reasoning"""
    evaluation_data: EvaluationInput
    force_regenerate: bool = Field(default=False, description="Force cache bypass")
