from pydantic import BaseModel, Field
from typing import Optional, Literal
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
