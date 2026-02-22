"""
Volume Profile Module for Phase 4
Calculates Point of Control (POC), Value Area High (VAH), and Value Area Low (VAL)
"""
import pandas as pd
import numpy as np
from typing import Dict, Optional, Tuple
import logging

logger = logging.getLogger(__name__)


class VolumeProfileCalculator:
    """
    Volume Profile Calculator
    Analyzes price-volume distribution to identify key levels
    """
    
    def __init__(self, value_area_percent: float = 0.70):
        """
        Args:
            value_area_percent: Percentage of volume for value area (default 70%)
        """
        self.value_area_percent = value_area_percent
        
    def calculate(
        self,
        df: pd.DataFrame,
        price_bins: int = 50
    ) -> Dict:
        """
        Calculate volume profile
        
        Args:
            df: DataFrame with 'close', 'high', 'low', 'volume' columns
            price_bins: Number of price bins for distribution
            
        Returns:
            Dictionary with POC, VAH, VAL, and profile data
        """
        try:
            if df is None or len(df) < 10:
                return {
                    'poc': None,
                    'vah': None,
                    'val': None,
                    'error': 'Insufficient data'
                }
            
            # Get price range
            price_low = df['low'].min()
            price_high = df['high'].max()
            
            if price_low >= price_high:
                return {
                    'poc': None,
                    'vah': None,
                    'val': None,
                    'error': 'Invalid price range'
                }
            
            # Create price bins
            price_range = price_high - price_low
            bin_size = price_range / price_bins
            
            # Initialize volume at price levels
            volume_at_price = {}
            
            # Distribute volume across price levels (TPO-style)
            for idx, row in df.iterrows():
                low = row['low']
                high = row['high']
                volume = row.get('volume', 1)  # Use 1 if volume not available
                
                # Find bins this candle touches
                low_bin = int((low - price_low) / bin_size)
                high_bin = int((high - price_low) / bin_size)
                
                # Distribute volume across touched bins
                num_bins = max(1, high_bin - low_bin + 1)
                volume_per_bin = volume / num_bins
                
                for bin_idx in range(low_bin, high_bin + 1):
                    if 0 <= bin_idx < price_bins:
                        price_level = price_low + (bin_idx * bin_size) + (bin_size / 2)
                        price_level = round(price_level, 2)
                        
                        if price_level not in volume_at_price:
                            volume_at_price[price_level] = 0
                        volume_at_price[price_level] += volume_per_bin
            
            if not volume_at_price:
                return {
                    'poc': None,
                    'vah': None,
                    'val': None,
                    'error': 'No volume data'
                }
            
            # Sort by price
            sorted_prices = sorted(volume_at_price.items())
            
            # Find Point of Control (price level with highest volume)
            poc_price = max(volume_at_price.items(), key=lambda x: x[1])[0]
            poc_volume = volume_at_price[poc_price]
            
            # Calculate total volume
            total_volume = sum(volume_at_price.values())
            
            # Find Value Area (70% of volume centered around POC)
            target_volume = total_volume * self.value_area_percent
            
            # Start from POC and expand outward
            poc_idx = None
            for i, (price, vol) in enumerate(sorted_prices):
                if price == poc_price:
                    poc_idx = i
                    break
            
            if poc_idx is None:
                return {
                    'poc': poc_price,
                    'vah': None,
                    'val': None,
                    'error': 'POC index not found'
                }
            
            # Expand value area
            accumulated_volume = poc_volume
            lower_idx = poc_idx
            upper_idx = poc_idx
            
            while accumulated_volume < target_volume:
                # Check which direction to expand
                lower_volume = sorted_prices[lower_idx - 1][1] if lower_idx > 0 else 0
                upper_volume = sorted_prices[upper_idx + 1][1] if upper_idx < len(sorted_prices) - 1 else 0
                
                if lower_volume == 0 and upper_volume == 0:
                    break
                
                # Expand to direction with more volume
                if lower_volume > upper_volume:
                    if lower_idx > 0:
                        lower_idx -= 1
                        accumulated_volume += lower_volume
                else:
                    if upper_idx < len(sorted_prices) - 1:
                        upper_idx += 1
                        accumulated_volume += upper_volume
            
            # Value Area Low and High
            val = sorted_prices[lower_idx][0]
            vah = sorted_prices[upper_idx][0]
            
            # Current price position
            current_price = df['close'].iloc[-1]
            
            if current_price > vah:
                price_position = 'ABOVE_VALUE'
            elif current_price < val:
                price_position = 'BELOW_VALUE'
            else:
                price_position = 'IN_VALUE'
            
            # Distance from POC
            poc_distance_pct = abs((current_price - poc_price) / current_price) * 100
            
            return {
                'poc': round(poc_price, 2),
                'vah': round(vah, 2),
                'val': round(val, 2),
                'current_price': round(current_price, 2),
                'price_position': price_position,
                'poc_distance_pct': round(poc_distance_pct, 3),
                'value_area_volume': round(accumulated_volume, 2),
                'value_area_pct': round((accumulated_volume / total_volume) * 100, 2),
                'total_volume': round(total_volume, 2),
                'poc_volume': round(poc_volume, 2),
                'interpretation': self._interpret_position(price_position, poc_distance_pct)
            }
            
        except Exception as e:
            logger.error(f"Error calculating volume profile: {e}", exc_info=True)
            return {
                'poc': None,
                'vah': None,
                'val': None,
                'error': str(e)
            }
    
    def _interpret_position(self, position: str, poc_distance: float) -> str:
        """
        Interpret price position relative to value area
        
        Args:
            position: Price position (ABOVE_VALUE, IN_VALUE, BELOW_VALUE)
            poc_distance: Distance from POC in percentage
            
        Returns:
            Interpretation string
        """
        if position == 'ABOVE_VALUE':
            if poc_distance > 2.0:
                return 'Price well above value area - strong bullish'
            else:
                return 'Price slightly above value area - moderately bullish'
        elif position == 'BELOW_VALUE':
            if poc_distance > 2.0:
                return 'Price well below value area - strong bearish'
            else:
                return 'Price slightly below value area - moderately bearish'
        else:  # IN_VALUE
            if poc_distance < 0.5:
                return 'Price at Point of Control - balanced market'
            else:
                return 'Price in value area - neutral conditions'


class FakeBreakoutDetector:
    """
    Fake Breakout Detector
    Identifies potential false breakouts
    """
    
    def __init__(self):
        pass
        
    def detect(
        self,
        df: pd.DataFrame,
        oi_analysis: Optional[Dict] = None,
        volume_profile: Optional[Dict] = None
    ) -> Dict:
        """
        Detect potential fake breakout conditions
        
        Args:
            df: DataFrame with OHLC data
            oi_analysis: OI analysis from option chain
            volume_profile: Volume profile data
            
        Returns:
            Dictionary with fake breakout risk assessment
        """
        try:
            risk_score = 0.0
            risk_factors = []
            
            if df is None or len(df) < 20:
                return {
                    'fake_breakout_risk': False,
                    'risk_score': 0.0,
                    'risk_factors': [],
                    'error': 'Insufficient data'
                }
            
            current_price = df['close'].iloc[-1]
            recent_high = df['high'].iloc[-20:].max()
            recent_low = df['low'].iloc[-20:].max()
            
            # Factor 1: Breakout without OI confirmation
            if oi_analysis:
                oi_trend = oi_analysis.get('oiTrend', 'NEUTRAL')
                pcr = oi_analysis.get('pcr', 1.0)
                
                # Price breaking high but bearish OI
                if current_price >= recent_high * 0.999 and oi_trend == 'PUT_HEAVY':
                    risk_score += 3.0
                    risk_factors.append('Breakout without OI confirmation')
                
                # Price breaking low but bullish OI
                if current_price <= recent_low * 1.001 and oi_trend == 'CALL_HEAVY':
                    risk_score += 3.0
                    risk_factors.append('Breakdown without OI confirmation')
                
                # Extreme PCR divergence
                if pcr > 2.0 or pcr < 0.5:
                    risk_score += 2.0
                    risk_factors.append('Extreme PCR suggests trap')
            
            # Factor 2: Volume analysis
            if 'volume' in df.columns:
                recent_volume = df['volume'].iloc[-5:].mean()
                avg_volume = df['volume'].iloc[-20:].mean()
                
                # Breakout with declining volume
                if recent_volume < avg_volume * 0.7:
                    risk_score += 2.0
                    risk_factors.append('Weak volume on breakout')
            
            # Factor 3: RSI divergence
            if len(df) >= 14:
                from ta.momentum import RSIIndicator
                rsi_indicator = RSIIndicator(df['close'], window=14)
                df['rsi'] = rsi_indicator.rsi()
                
                current_rsi = df['rsi'].iloc[-1]
                
                # Price making new high but RSI not confirming
                if current_price >= recent_high * 0.999 and current_rsi < 65:
                    risk_score += 2.0
                    risk_factors.append('Bearish RSI divergence')
                
                # Price making new low but RSI not confirming
                if current_price <= recent_low * 1.001 and current_rsi > 35:
                    risk_score += 2.0
                    risk_factors.append('Bullish RSI divergence')
            
            # Factor 4: Volume profile divergence
            if volume_profile and volume_profile.get('poc'):
                poc = volume_profile['poc']
                price_position = volume_profile.get('price_position', 'IN_VALUE')
                
                # Breakout too far from value area
                if price_position in ['ABOVE_VALUE', 'BELOW_VALUE']:
                    poc_distance = volume_profile.get('poc_distance_pct', 0)
                    if poc_distance > 3.0:
                        risk_score += 2.0
                        risk_factors.append('Price too far from value area')
            
            # Determine overall risk
            fake_breakout_risk = risk_score >= 5.0
            
            return {
                'fake_breakout_risk': fake_breakout_risk,
                'risk_score': round(risk_score, 2),
                'risk_factors': risk_factors,
                'interpretation': 'High fake breakout risk' if fake_breakout_risk else 'Low fake breakout risk'
            }
            
        except Exception as e:
            logger.error(f"Error detecting fake breakout: {e}", exc_info=True)
            return {
                'fake_breakout_risk': False,
                'risk_score': 0.0,
                'risk_factors': [],
                'error': str(e)
            }
