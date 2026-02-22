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
    volatility: Dict = Field(..., description="Volatility scoring details")
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


# ============================================================================
# Phase 4: Advanced Filters and No-Trade Scoring Models
# ============================================================================

class NoTradeComponents(BaseModel):
    """Individual no-trade scoring components breakdown"""
    time_risk: Dict = Field(..., description="Time-based risk scoring details")
    chop_detection: Dict = Field(..., description="Chop/chopiness detection details")
    resistance_proximity: Dict = Field(..., description="Support/resistance proximity details")
    volatility_compression: Dict = Field(..., description="Volatility compression details")
    consecutive_loss: Dict = Field(..., description="Consecutive loss guard details")


class NoTradeScoreResponse(BaseModel):
    """Response model for no-trade score"""
    symbol: str
    timeframe: str
    timestamp: datetime
    no_trade_score: float = Field(..., description="Aggregate no-trade score (0-10, higher = more likely to avoid)")
    components: NoTradeComponents = Field(..., description="Breakdown of individual no-trade components")
    recommendation: str = Field(..., description="TRADE or NO-TRADE recommendation")
    blocking_reasons: List[str] = Field(..., description="List of reasons blocking trading")


class VolumeProfileData(BaseModel):
    """Volume profile calculation results"""
    poc: float = Field(..., description="Point of Control (price with highest volume)")
    vah: float = Field(..., description="Value Area High (70% volume upper bound)")
    val: float = Field(..., description="Value Area Low (70% volume lower bound)")
    volume_distribution: Dict = Field(..., description="Volume distribution across price bins")


class FakeBreakoutData(BaseModel):
    """Fake breakout detection results"""
    is_fake_breakout: bool = Field(..., description="Whether a fake breakout was detected")
    risk_score: float = Field(..., description="Risk score (0-10)")
    reasons: List[str] = Field(..., description="Reasons for fake breakout detection")


class EnhancedEvaluationResponse(BaseModel):
    """Enhanced evaluation response with Phase 4 features"""
    symbol: str
    timeframe: str
    timestamp: datetime
    setup_score: float = Field(..., description="Setup score (0-10)")
    no_trade_score: float = Field(..., description="No-trade score (0-10)")
    volume_profile: VolumeProfileData = Field(..., description="Volume profile analysis")
    fake_breakout: FakeBreakoutData = Field(..., description="Fake breakout detection")
    trade_recommendation: str = Field(..., description="TRADE or NO-TRADE")


class RiskModeRequest(BaseModel):
    """Request model for setting risk mode"""
    mode: Literal["CONSERVATIVE", "BALANCED", "AGGRESSIVE"] = Field(..., description="Risk mode to set")


class TradeDecisionResponse(BaseModel):
    """Response model for trade gating decision"""
    symbol: str
    timestamp: datetime
    trade_allowed: bool = Field(..., description="Whether trading is allowed")
    decision: str = Field(..., description="Decision explanation")
    confidence: float = Field(..., description="Confidence in decision (0-100)")
    setup_score: float = Field(..., description="Current setup score")
    no_trade_score: float = Field(..., description="Current no-trade score")
    current_risk_mode: str = Field(..., description="Current risk mode")
    blocking_reasons: List[str] = Field(..., description="Reasons blocking trade")
    warnings: List[str] = Field(..., description="Non-blocking warnings")
