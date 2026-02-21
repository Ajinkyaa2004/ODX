from pydantic import BaseModel, Field
from typing import Optional, Literal, List, Dict
from datetime import datetime
from decimal import Decimal


class OHLCData(BaseModel):
    """OHLC data model"""
    open: Decimal
    high: Decimal
    low: Decimal
    close: Decimal
    volume: int


class EMAData(BaseModel):
    """EMA indicator data"""
    ema9: Decimal
    ema20: Decimal
    ema50: Decimal
    slope: Literal["bullish", "bearish", "neutral"]
    alignment: Literal["bullish", "bearish", "mixed"]


class VWAPData(BaseModel):
    """VWAP indicator data"""
    value: Decimal
    position: Literal["above", "below", "at"]
    distance: Decimal


class IndicatorData(BaseModel):
    """Complete indicator data"""
    symbol: str
    timeframe: Literal["5m", "15m"]
    timestamp: datetime
    ema: Optional[EMAData] = None
    vwap: Optional[VWAPData] = None


class IndicatorRequest(BaseModel):
    """Request model for indicator calculation"""
    symbol: str = Field(..., description="Symbol to calculate indicators for (NIFTY or BANKNIFTY)")
    timeframe: Literal["5m", "15m"] = Field(..., description="Timeframe for calculation")


class IndicatorResponse(BaseModel):
    """Response model for indicator calculation"""
    symbol: str
    timeframe: str
    timestamp: datetime
    indicators: dict
    success: bool = True
    message: Optional[str] = None


# ============================================================================
# Phase 2: Scoring Models
# ============================================================================

class ScoreRequest(BaseModel):
    """Request model for setup score calculation"""
    symbol: str = Field(..., description="Symbol to score (NIFTY or BANKNIFTY)")
    timeframe: Literal["5m", "15m"] = Field("5m", description="Timeframe for scoring")


class ScoreComponents(BaseModel):
    """Individual scoring components breakdown"""
    trend: Dict = Field(..., description="Trend scoring details")
    vwap: Dict = Field(..., description="VWAP scoring details")
    structure: Dict = Field(..., description="Structure scoring details")
    momentum: Dict = Field(..., description="Momentum scoring details")
    internals: Dict = Field(..., description="Internals scoring details")
    oi_confirmation: Dict = Field(..., description="OI confirmation scoring details")


class ScoreResponse(BaseModel):
    """Response model for setup score"""
    symbol: str
    timeframe: str
    timestamp: datetime
    setup_score: float = Field(..., description="Aggregate setup score (0-10)")
    components: ScoreComponents = Field(..., description="Breakdown of individual components")
    market_bias: str = Field(..., description="Overall market bias: BULLISH, BEARISH, or NEUTRAL")
    evaluation_time_seconds: float = Field(..., description="Time taken to evaluate")


class ScoreHistoryResponse(BaseModel):
    """Response model for historical scores"""
    symbol: str
    timeframe: str
    scores: List[ScoreResponse] = Field(..., description="List of historical scores")
    count: int = Field(..., description="Number of scores returned")
