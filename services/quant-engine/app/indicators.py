import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Optional
from decimal import Decimal
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


class IndicatorCalculator:
    """
    Calculator for technical indicators (EMA, VWAP, slopes)
    """
    
    def __init__(self):
        self.ema_periods = [9, 20, 50]
        
    def calculate_ema(
        self, 
        prices: List[float], 
        period: int
    ) -> Optional[float]:
        """
        Calculate Exponential Moving Average
        
        Args:
            prices: List of price values
            period: EMA period (9, 20, 50)
            
        Returns:
            EMA value or None if insufficient data
        """
        if len(prices) < period:
            logger.warning(f"Insufficient data for EMA {period}: {len(prices)} < {period}")
            return None
            
        try:
            df = pd.DataFrame({'price': prices})
            ema = df['price'].ewm(span=period, adjust=False).mean().iloc[-1]
            return float(ema)
        except Exception as e:
            logger.error(f"Error calculating EMA {period}: {e}")
            return None
    
    def calculate_all_emas(
        self, 
        prices: List[float]
    ) -> Dict[str, Optional[float]]:
        """
        Calculate all EMAs (9, 20, 50)
        
        Returns:
            Dictionary with ema9, ema20, ema50
        """
        return {
            'ema9': self.calculate_ema(prices, 9),
            'ema20': self.calculate_ema(prices, 20),
            'ema50': self.calculate_ema(prices, 50)
        }
    
    def detect_ema_slope(
        self, 
        ema_values: List[float], 
        lookback: int = 5
    ) -> str:
        """
        Detect EMA slope direction
        
        Args:
            ema_values: Recent EMA values
            lookback: Number of periods to check
            
        Returns:
            "bullish", "bearish", or "neutral"
        """
        if len(ema_values) < lookback:
            return "neutral"
        
        try:
            recent_values = ema_values[-lookback:]
            
            # Linear regression to determine slope
            x = np.arange(len(recent_values))
            y = np.array(recent_values)
            
            # Calculate slope
            slope = np.polyfit(x, y, 1)[0]
            
            # Determine direction based on slope
            threshold = 0.01  # Minimum slope to be considered trending
            
            if slope > threshold:
                return "bullish"
            elif slope < -threshold:
                return "bearish"
            else:
                return "neutral"
                
        except Exception as e:
            logger.error(f"Error detecting EMA slope: {e}")
            return "neutral"
    
    def detect_ema_alignment(
        self, 
        ema9: float, 
        ema20: float, 
        ema50: float
    ) -> str:
        """
        Detect EMA alignment (bullish if ema9 > ema20 > ema50)
        
        Returns:
            "bullish", "bearish", or "mixed"
        """
        if ema9 is None or ema20 is None or ema50 is None:
            return "mixed"
        
        try:
            if ema9 > ema20 > ema50:
                return "bullish"
            elif ema9 < ema20 < ema50:
                return "bearish"
            else:
                return "mixed"
        except Exception as e:
            logger.error(f"Error detecting EMA alignment: {e}")
            return "mixed"
    
    def calculate_vwap(
        self, 
        prices: List[float], 
        volumes: List[int]
    ) -> Optional[float]:
        """
        Calculate Volume Weighted Average Price
        
        Args:
            prices: List of typical prices (H+L+C)/3
            volumes: List of volumes
            
        Returns:
            VWAP value or None if insufficient data
        """
        if len(prices) != len(volumes) or len(prices) == 0:
            logger.warning("Invalid data for VWAP calculation")
            return None
        
        try:
            df = pd.DataFrame({
                'price': prices,
                'volume': volumes
            })
            
            # Calculate VWAP
            df['pv'] = df['price'] * df['volume']
            vwap = df['pv'].sum() / df['volume'].sum()
            
            return float(vwap)
        except Exception as e:
            logger.error(f"Error calculating VWAP: {e}")
            return None
    
    def calculate_vwap_position(
        self, 
        current_price: float, 
        vwap: float
    ) -> Tuple[str, float]:
        """
        Calculate position relative to VWAP
        
        Returns:
            Tuple of (position, distance)
            position: "above", "below", or "at"
            distance: Absolute distance from VWAP
        """
        if vwap is None or current_price is None:
            return "at", 0.0
        
        try:
            distance = current_price - vwap
            distance_percent = (distance / vwap) * 100
            
            threshold = 0.05  # 0.05% threshold for "at"
            
            if abs(distance_percent) < threshold:
                position = "at"
            elif distance > 0:
                position = "above"
            else:
                position = "below"
            
            return position, abs(distance)
        except Exception as e:
            logger.error(f"Error calculating VWAP position: {e}")
            return "at", 0.0
    
    def resample_to_timeframe(
        self, 
        data: List[Dict], 
        timeframe: str = "5m"
    ) -> pd.DataFrame:
        """
        Resample 1-minute data to specified timeframe
        
        Args:
            data: List of OHLC dictionaries with timestamp
            timeframe: Target timeframe (5m, 15m)
            
        Returns:
            Resampled DataFrame
        """
        try:
            df = pd.DataFrame(data)
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            df.set_index('timestamp', inplace=True)
            
            # Resample to timeframe
            resampled = df.resample(timeframe).agg({
                'open': 'first',
                'high': 'max',
                'low': 'min',
                'close': 'last',
                'volume': 'sum'
            }).dropna()
            
            return resampled
        except Exception as e:
            logger.error(f"Error resampling data to {timeframe}: {e}")
            return pd.DataFrame()
    
    def calculate_typical_price(
        self, 
        high: float, 
        low: float, 
        close: float
    ) -> float:
        """
        Calculate typical price (H+L+C)/3
        """
        return (high + low + close) / 3
