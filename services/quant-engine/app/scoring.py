"""
Scoring modules for Phase 2 - Basic Scoring Engine
"""
import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Tuple
from datetime import datetime
import logging
from ta.momentum import RSIIndicator
from ta.trend import SMAIndicator

logger = logging.getLogger(__name__)


class TrendScorer:
    """
    Trend Scoring Module (25% weight)
    Analyzes EMA alignment, slope consistency, and trend strength
    """
    
    def __init__(self):
        self.weight = 0.25
        
    def score(
        self,
        ema_5m: Optional[Dict],
        ema_15m: Optional[Dict],
        price: float
    ) -> Tuple[float, Dict]:
        """
        Calculate trend score (0-10)
        
        Args:
            ema_5m: 5m EMA data (ema9, ema20, ema50, slope, alignment)
            ema_15m: 15m EMA data
            price: Current price
            
        Returns:
            Tuple of (score, details)
        """
        try:
            score = 0.0
            details = {}
            
            if not ema_5m or not ema_15m:
                logger.warning("Missing EMA data for trend scoring")
                return 0.0, {"error": "Missing EMA data"}
            
            # Component 1: 5m EMA alignment (0-3 points)
            alignment_5m = ema_5m.get('alignment', 'mixed')
            if alignment_5m == 'bullish':
                score += 3.0
                details['alignment_5m'] = 'bullish'
            elif alignment_5m == 'bearish':
                score += 3.0
                details['alignment_5m'] = 'bearish'
            else:
                score += 1.0
                details['alignment_5m'] = 'mixed'
            
            # Component 2: 15m EMA alignment (0-3 points)
            alignment_15m = ema_15m.get('alignment', 'mixed')
            if alignment_15m == 'bullish':
                score += 3.0
                details['alignment_15m'] = 'bullish'
            elif alignment_15m == 'bearish':
                score += 3.0
                details['alignment_15m'] = 'bearish'
            else:
                score += 1.0
                details['alignment_15m'] = 'mixed'
            
            # Component 3: Slope consistency (0-2 points)
            slope_5m = ema_5m.get('slope', 'neutral')
            slope_15m = ema_15m.get('slope', 'neutral')
            
            if slope_5m == slope_15m and slope_5m != 'neutral':
                score += 2.0
                details['slope_consistency'] = 'aligned'
            elif slope_5m != 'neutral' or slope_15m != 'neutral':
                score += 1.0
                details['slope_consistency'] = 'partial'
            else:
                details['slope_consistency'] = 'none'
            
            # Component 4: Price position relative to EMAs (0-2 points)
            ema9_5m = ema_5m.get('ema9', price)
            
            if price > ema9_5m:
                score += 2.0
                details['price_position'] = 'above_ema9'
            elif price < ema9_5m:
                score += 2.0
                details['price_position'] = 'below_ema9'
            else:
                score += 1.0
                details['price_position'] = 'at_ema9'
            
            # Normalize to 0-10
            normalized_score = min(10.0, max(0.0, score))
            
            details['raw_score'] = score
            details['normalized_score'] = normalized_score
            
            return normalized_score, details
            
        except Exception as e:
            logger.error(f"Error calculating trend score: {e}", exc_info=True)
            return 0.0, {"error": str(e)}


class VWAPScorer:
    """
    VWAP Scoring Module (15% weight)
    Analyzes price position relative to VWAP
    """
    
    def __init__(self):
        self.weight = 0.15
        
    def score(
        self,
        price: float,
        vwap: Optional[Dict]
    ) -> Tuple[float, Dict]:
        """
        Calculate VWAP score (0-10)
        
        Args:
            price: Current price
            vwap: VWAP data (value, position, distance)
            
        Returns:
            Tuple of (score, details)
        """
        try:
            score = 0.0
            details = {}
            
            if not vwap or 'value' not in vwap:
                logger.warning("Missing VWAP data for scoring")
                return 0.0, {"error": "Missing VWAP data"}
            
            vwap_value = float(vwap.get('value', price))
            position = vwap.get('position', 'at')
            distance = float(vwap.get('distance', 0))
            
            # Calculate distance percentage
            distance_pct = abs((price - vwap_value) / vwap_value * 100) if vwap_value > 0 else 0
            
            # Component 1: Distance from VWAP (0-5 points)
            # Closer to VWAP is better for mean reversion
            if distance_pct < 0.1:
                score += 5.0
                details['distance_score'] = 'optimal'
            elif distance_pct < 0.3:
                score += 4.0
                details['distance_score'] = 'good'
            elif distance_pct < 0.5:
                score += 3.0
                details['distance_score'] = 'moderate'
            elif distance_pct < 1.0:
                score += 2.0
                details['distance_score'] = 'far'
            else:
                score += 1.0
                details['distance_score'] = 'very_far'
            
            # Component 2: Position relative to VWAP (0-5 points)
            if position == 'above':
                score += 5.0
                details['position_bias'] = 'bullish'
            elif position == 'below':
                score += 5.0
                details['position_bias'] = 'bearish'
            else:
                score += 3.0
                details['position_bias'] = 'neutral'
            
            details['distance_pct'] = round(distance_pct, 4)
            details['vwap_value'] = round(vwap_value, 2)
            
            # Normalize to 0-10
            normalized_score = min(10.0, max(0.0, score))
            details['normalized_score'] = normalized_score
            
            return normalized_score, details
            
        except Exception as e:
            logger.error(f"Error calculating VWAP score: {e}", exc_info=True)
            return 0.0, {"error": str(e)}


class StructureScorer:
    """
    Market Structure Scoring Module (15% weight)
    Analyzes higher highs/lows and support/resistance
    """
    
    def __init__(self):
        self.weight = 0.15
        
    def score(
        self,
        price_history: List[float],
        high_history: List[float],
        low_history: List[float]
    ) -> Tuple[float, Dict]:
        """
        Calculate market structure score (0-10)
        
        Args:
            price_history: Recent close prices
            high_history: Recent high prices
            low_history: Recent low prices
            
        Returns:
            Tuple of (score, details)
        """
        try:
            score = 0.0
            details = {}
            
            if len(price_history) < 10:
                logger.warning("Insufficient price history for structure scoring")
                return 5.0, {"error": "Insufficient data", "default": True}
            
            # Component 1: Higher Highs / Lower Lows (0-5 points)
            recent_highs = high_history[-5:]
            recent_lows = low_history[-5:]
            
            higher_highs = sum(1 for i in range(1, len(recent_highs)) if recent_highs[i] > recent_highs[i-1])
            lower_lows = sum(1 for i in range(1, len(recent_lows)) if recent_lows[i] < recent_lows[i-1])
            
            if higher_highs >= 3:
                score += 5.0
                details['structure'] = 'bullish_hh'
            elif lower_lows >= 3:
                score += 5.0
                details['structure'] = 'bearish_ll'
            elif higher_highs >= 2 or lower_lows >= 2:
                score += 3.0
                details['structure'] = 'trending'
            else:
                score += 2.0
                details['structure'] = 'choppy'
            
            # Component 2: Support/Resistance proximity (0-5 points)
            current_price = price_history[-1]
            recent_high = max(high_history[-20:]) if len(high_history) >= 20 else max(high_history)
            recent_low = min(low_history[-20:]) if len(low_history) >= 20 else min(low_history)
            
            # Distance from recent high/low
            dist_from_high = ((recent_high - current_price) / recent_high * 100) if recent_high > 0 else 0
            dist_from_low = ((current_price - recent_low) / recent_low * 100) if recent_low > 0 else 0
            
            # Reward: Away from resistance/support (room to move)
            if dist_from_high > 2.0 and dist_from_low > 2.0:
                score += 5.0
                details['sr_status'] = 'clear'
            elif dist_from_high > 1.0 and dist_from_low > 1.0:
                score += 3.0
                details['sr_status'] = 'moderate'
            else:
                score += 1.0
                details['sr_status'] = 'near_sr'
            
            details['higher_highs'] = higher_highs
            details['lower_lows'] = lower_lows
            details['dist_from_high'] = round(dist_from_high, 2)
            details['dist_from_low'] = round(dist_from_low, 2)
            
            # Normalize to 0-10
            normalized_score = min(10.0, max(0.0, score))
            details['normalized_score'] = normalized_score
            
            return normalized_score, details
            
        except Exception as e:
            logger.error(f"Error calculating structure score: {e}", exc_info=True)
            return 5.0, {"error": str(e), "default": True}


class MomentumScorer:
    """
    Momentum Scoring Module (10% weight)
    Analyzes RSI and rate of change
    """
    
    def __init__(self):
        self.weight = 0.10
        
    def score(
        self,
        price_history: List[float]
    ) -> Tuple[float, Dict]:
        """
        Calculate momentum score (0-10)
        
        Args:
            price_history: Recent close prices
            
        Returns:
            Tuple of (score, details)
        """
        try:
            score = 0.0
            details = {}
            
            if len(price_history) < 14:
                logger.warning("Insufficient price history for momentum scoring")
                return 5.0, {"error": "Insufficient data", "default": True}
            
            # Calculate RSI
            df = pd.DataFrame({'close': price_history})
            rsi_indicator = RSIIndicator(close=df['close'], window=14)
            rsi = rsi_indicator.rsi().iloc[-1]
            
            # Component 1: RSI value (0-5 points)
            # Reward RSI in trending zones
            if 40 <= rsi <= 60:
                score += 3.0
                details['rsi_zone'] = 'neutral'
            elif (30 <= rsi < 40) or (60 < rsi <= 70):
                score += 5.0
                details['rsi_zone'] = 'trending'
            elif (20 <= rsi < 30) or (70 < rsi <= 80):
                score += 4.0
                details['rsi_zone'] = 'strong_trending'
            else:
                score += 2.0
                details['rsi_zone'] = 'extreme'
            
            # Component 2: Rate of change (0-5 points)
            current_price = price_history[-1]
            price_5_ago = price_history[-6] if len(price_history) >= 6 else price_history[0]
            
            roc = ((current_price - price_5_ago) / price_5_ago * 100) if price_5_ago > 0 else 0
            
            # Reward positive momentum
            if abs(roc) > 0.5:
                score += 5.0
                details['roc_strength'] = 'strong'
            elif abs(roc) > 0.2:
                score += 3.0
                details['roc_strength'] = 'moderate'
            else:
                score += 1.0
                details['roc_strength'] = 'weak'
            
            details['rsi'] = round(float(rsi), 2)
            details['roc'] = round(roc, 4)
            
            # Normalize to 0-10
            normalized_score = min(10.0, max(0.0, score))
            details['normalized_score'] = normalized_score
            
            return normalized_score, details
            
        except Exception as e:
            logger.error(f"Error calculating momentum score: {e}", exc_info=True)
            return 5.0, {"error": str(e), "default": True}


class InternalsScorer:
    """
    Market Internals Scoring Module (5% weight)
    Analyzes futures OI and index correlation
    """
    
    def __init__(self):
        self.weight = 0.05
        
    def score(
        self,
        symbol: str,
        futures_oi: Optional[float] = None,
        nifty_price: Optional[float] = None,
        banknifty_price: Optional[float] = None
    ) -> Tuple[float, Dict]:
        """
        Calculate market internals score (0-10)
        
        Args:
            symbol: Trading symbol
            futures_oi: Futures open interest
            nifty_price: NIFTY current price
            banknifty_price: BANKNIFTY current price
            
        Returns:
            Tuple of (score, details)
        """
        try:
            score = 5.0  # Default neutral score
            details = {'status': 'basic_internals'}
            
            # Component 1: Futures OI (0-5 points)
            if futures_oi is not None:
                # Placeholder logic - requires historical OI for change calculation
                score += 2.5
                details['futures_oi'] = futures_oi
                details['oi_status'] = 'available'
            else:
                score += 2.0
                details['oi_status'] = 'unavailable'
            
            # Component 2: Index correlation (0-5 points)
            if nifty_price is not None and banknifty_price is not None:
                # Both indices available shows healthy market
                score += 2.5
                details['index_correlation'] = 'both_active'
                details['nifty_price'] = nifty_price
                details['banknifty_price'] = banknifty_price
            else:
                score += 2.0
                details['index_correlation'] = 'partial'
            
            # Normalize to 0-10
            normalized_score = min(10.0, max(0.0, score))
            details['normalized_score'] = normalized_score
            
            return normalized_score, details
            
        except Exception as e:
            logger.error(f"Error calculating internals score: {e}", exc_info=True)
            return 5.0, {"error": str(e), "default": True}


class VolatilityScorer:
    """
    Volatility Regime Scoring Module (10% weight) - PHASE 4
    Analyzes ATR expansion/compression and volatility regime
    """
    
    def __init__(self):
        self.weight = 0.10
        
    def score(
        self,
        df: pd.DataFrame,
        period: int = 14
    ) -> Tuple[float, Dict]:
        """
        Calculate volatility score (0-10)
        
        Args:
            df: DataFrame with OHLC data
            period: ATR period (default 14)
            
        Returns:
            Tuple of (score, details)
        """
        try:
            score = 5.0  # Default neutral
            details = {'regime': 'NORMAL'}
            
            if df is None or len(df) < period + 20:
                logger.warning("Insufficient data for volatility scoring")
                return 5.0, {"error": "Insufficient data", "regime": "UNKNOWN"}
            
            # Calculate ATR (14-period)
            df = df.copy()
            df['h_l'] = df['high'] - df['low']
            df['h_pc'] = abs(df['high'] - df['close'].shift(1))
            df['l_pc'] = abs(df['low'] - df['close'].shift(1))
            df['tr'] = df[['h_l', 'h_pc', 'l_pc']].max(axis=1)
            df['atr'] = df['tr'].rolling(window=period).mean()
            
            # Calculate 20-period average ATR
            df['atr_ma'] = df['atr'].rolling(window=20).mean()
            
            # Get current values
            current_atr = df['atr'].iloc[-1]
            avg_atr = df['atr_ma'].iloc[-1]
            
            if pd.isna(current_atr) or pd.isna(avg_atr) or avg_atr == 0:
                return 5.0, {"error": "Invalid ATR calculation", "regime": "UNKNOWN"}
            
            # Calculate ATR expansion percentage
            atr_expansion = ((current_atr - avg_atr) / avg_atr) * 100
            details['atr'] = round(current_atr, 2)
            details['atr_avg'] = round(avg_atr, 2)
            details['atr_expansion_pct'] = round(atr_expansion, 2)
            
            # Calculate current range vs 20-period average range
            current_range = df['high'].iloc[-1] - df['low'].iloc[-1]
            avg_range = (df['high'] - df['low']).rolling(window=20).mean().iloc[-1]
            range_ratio = current_range / avg_range if avg_range > 0 else 1.0
            details['range_ratio'] = round(range_ratio, 2)
            
            # Classify volatility regime and score
            if atr_expansion < -20:  # Strong compression
                score = 3.0
                details['regime'] = 'COMPRESSION'
                details['interpretation'] = 'Extreme compression - breakout likely but risky'
            elif atr_expansion < -10:  # Moderate compression
                score = 5.0
                details['regime'] = 'COMPRESSION'
                details['interpretation'] = 'Moderate compression'
            elif atr_expansion < 10:  # Normal
                score = 8.0
                details['regime'] = 'NORMAL'
                details['interpretation'] = 'Normal volatility - ideal for trading'
            elif atr_expansion < 20:  # Moderate expansion
                score = 7.0
                details['regime'] = 'EXPANSION'
                details['interpretation'] = 'Moderate expansion'
            else:  # Strong expansion
                score = 4.0
                details['regime'] = 'EXPANSION'
                details['interpretation'] = 'High volatility - risk increased'
            
            # Adjust score based on range ratio
            if range_ratio > 1.5:
                score -= 1.0
                details['interpretation'] += ' | Wide range detected'
            elif range_ratio < 0.5:
                score -= 1.0
                details['interpretation'] += ' | Narrow range detected'
            
            # Normalize to 0-10
            normalized_score = min(10.0, max(0.0, score))
            details['normalized_score'] = normalized_score
            
            return normalized_score, details
            
        except Exception as e:
            logger.error(f"Error calculating volatility score: {e}", exc_info=True)
            return 5.0, {"error": str(e), "regime": "UNKNOWN", "default": True}


class OIConfirmationScorer:
    """
    OI Confirmation Scoring Module (20% weight) - PHASE 3
    Analyzes option chain OI, PCR, and strike positioning
    """
    
    def __init__(self):
        self.weight = 0.20
        
    def score(
        self,
        oi_analysis: Optional[Dict],
        market_bias: str = 'NEUTRAL'
    ) -> Tuple[float, Dict]:
        """
        Calculate OI confirmation score (0-10)
        
        Args:
            oi_analysis: OI analysis data from option-chain-service
            market_bias: Current market bias from other indicators
            
        Returns:
            Tuple of (score, details)
        """
        try:
            score = 0.0
            details = {}
            
            # If no OI data available, return placeholder score
            if not oi_analysis:
                return 5.0, {
                    "status": "no_oi_data",
                    "placeholder": True,
                    "message": "Option chain data not available"
                }
            
            # Component 1: PCR Analysis (0-4 points)
            pcr = oi_analysis.get('pcr', 1.0)
            
            if 1.2 <= pcr <= 1.8:
                score += 4.0
                details['pcr_signal'] = 'bullish'
            elif 0.6 <= pcr <= 0.8:
                score += 4.0
                details['pcr_signal'] = 'bearish'
            elif 0.9 <= pcr <= 1.1:
                score += 2.0
                details['pcr_signal'] = 'neutral'
            else:
                score += 1.0
                details['pcr_signal'] = 'extreme'
            
            details['pcr'] = round(pcr, 3)
            
            # Component 2: OI Trend Alignment (0-3 points)
            oi_trend = oi_analysis.get('oiTrend', 'NEUTRAL')
            
            if oi_trend == market_bias and market_bias != 'NEUTRAL':
                score += 3.0
                details['trend_alignment'] = 'confirmed'
            elif oi_trend != 'NEUTRAL':
                score += 2.0
                details['trend_alignment'] = 'partial'
            else:
                score += 1.0
                details['trend_alignment'] = 'none'
            
            details['oi_trend'] = oi_trend
            details['market_bias'] = market_bias
            
            # Component 3: OI Pattern Strength (0-3 points)
            bullish_score = oi_analysis.get('bullishScore', 0)
            bearish_score = oi_analysis.get('bearishScore', 0)
            
            max_pattern_score = max(bullish_score, bearish_score)
            
            if max_pattern_score >= 7.0:
                score += 3.0
                details['pattern_strength'] = 'strong'
            elif max_pattern_score >= 5.0:
                score += 2.0
                details['pattern_strength'] = 'moderate'
            else:
                score += 1.0
                details['pattern_strength'] = 'weak'
            
            details['bullish_score'] = round(bullish_score, 2)
            details['bearish_score'] = round(bearish_score, 2)
            
            # Normalize to 0-10
            normalized_score = min(10.0, max(0.0, score))
            details['normalized_score'] = normalized_score
            
            return normalized_score, details
            
        except Exception as e:
            logger.error(f"Error calculating OI confirmation score: {e}", exc_info=True)
            return 5.0, {"error": str(e), "default": True}


class SetupScorer:
    """
    Aggregate Setup Scorer
    Combines all component scores with weights
    """
    
    def __init__(self):
        self.trend_scorer = TrendScorer()
        self.vwap_scorer = VWAPScorer()
        self.structure_scorer = StructureScorer()
        self.momentum_scorer = MomentumScorer()
        self.internals_scorer = InternalsScorer()
        self.volatility_scorer = VolatilityScorer()  # PHASE 4: Now active
        self.oi_scorer = OIConfirmationScorer()  # PHASE 3: Active
        
        # Phase 4 weights (All components now active)
        self.weights = {
            'trend': 0.25,
            'vwap': 0.15,
            'structure': 0.15,
            'momentum': 0.10,
            'internals': 0.05,
            'volatility': 0.10,  # PHASE 4: NOW ACTIVE
            'oi': 0.20  # PHASE 3: ACTIVE
        }
        
    def calculate_setup_score(
        self,
        symbol: str,
        price: float,
        ema_5m: Optional[Dict],
        ema_15m: Optional[Dict],
        vwap: Optional[Dict],
        price_history: List[float],
        high_history: List[float],
        low_history: List[float],
        df_ohlc: Optional[pd.DataFrame] = None,  # PHASE 4: For volatility calculation
        futures_oi: Optional[float] = None,
        nifty_price: Optional[float] = None,
        banknifty_price: Optional[float] = None,
        oi_analysis: Optional[Dict] = None  # PHASE 3: OI Analysis from option chain
    ) -> Dict:
        """
        Calculate complete setup score
        
        Returns:
            Dictionary with setup_score, components, and market_bias
        """
        try:
            start_time = datetime.now()
            
            # Calculate individual scores
            trend_score, trend_details = self.trend_scorer.score(ema_5m, ema_15m, price)
            vwap_score, vwap_details = self.vwap_scorer.score(price, vwap)
            structure_score, structure_details = self.structure_scorer.score(
                price_history, high_history, low_history
            )
            momentum_score, momentum_details = self.momentum_scorer.score(price_history)
            internals_score, internals_details = self.internals_scorer.score(
                symbol, futures_oi, nifty_price, banknifty_price
            )
            
            # Determine preliminary market bias (for OI scorer)
            preliminary_bias = self._determine_market_bias(
                trend_details, vwap_details, structure_details, momentum_details
            )
            
            # PHASE 4: Calculate volatility score
            volatility_score, volatility_details = self.volatility_scorer.score(df_ohlc)
            
            # PHASE 3: Calculate OI confirmation score
            oi_score, oi_details = self.oi_scorer.score(oi_analysis, preliminary_bias)
            
            # Calculate weighted scores
            components = {
                'trend': {
                    'score': round(trend_score, 2),
                    'weight': self.weights['trend'],
                    'weighted': round(trend_score * self.weights['trend'], 4),
                    'details': trend_details
                },
                'vwap': {
                    'score': round(vwap_score, 2),
                    'weight': self.weights['vwap'],
                    'weighted': round(vwap_score * self.weights['vwap'], 4),
                    'details': vwap_details
                },
                'structure': {
                    'score': round(structure_score, 2),
                    'weight': self.weights['structure'],
                    'weighted': round(structure_score * self.weights['structure'], 4),
                    'details': structure_details
                },
                'momentum': {
                    'score': round(momentum_score, 2),
                    'weight': self.weights['momentum'],
                    'weighted': round(momentum_score * self.weights['momentum'], 4),
                    'details': momentum_details
                },
                'internals': {
                    'score': round(internals_score, 2),
                    'weight': self.weights['internals'],
                    'weighted': round(internals_score * self.weights['internals'], 4),
                    'details': internals_details
                },
                'oi': {
                    'score': round(oi_score, 2),  # PHASE 3: Now active
                    'weight': self.weights['oi'],
                    'weighted': round(oi_score * self.weights['oi'], 4),
                    'details': oi_details
                },
                'volatility': {
                    'score': round(volatility_score, 2),  # PHASE 4: Now active
                    'weight': self.weights['volatility'],
                    'weighted': round(volatility_score * self.weights['volatility'], 4),
                    'details': volatility_details
                }
            }
            
            # Calculate total setup score
            setup_score = sum(comp['weighted'] for comp in components.values())
            setup_score = round(setup_score, 2)
            
            # Determine market bias
            market_bias = self._determine_market_bias(
                trend_details, vwap_details, structure_details, momentum_details
            )
            
            # Calculate evaluation time
            evaluation_time = (datetime.now() - start_time).total_seconds()
            
            return {
                'symbol': symbol,
                'timestamp': datetime.utcnow(),
                'setup_score': setup_score,
                'components': components,
                'market_bias': market_bias,
                'evaluation_time_seconds': round(evaluation_time, 4)
            }
            
        except Exception as e:
            logger.error(f"Error calculating setup score: {e}", exc_info=True)
            return {
                'symbol': symbol,
                'timestamp': datetime.utcnow(),
                'setup_score': 0.0,
                'components': {},
                'market_bias': 'NEUTRAL',
                'evaluation_time_seconds': 0.0,
                'error': str(e)
            }
    
    def _determine_market_bias(
        self,
        trend_details: Dict,
        vwap_details: Dict,
        structure_details: Dict,
        momentum_details: Dict
    ) -> str:
        """
        Determine overall market bias based on component details
        
        Returns:
            "BULLISH", "BEARISH", or "NEUTRAL"
        """
        try:
            bullish_signals = 0
            bearish_signals = 0
            
            # Check trend alignment
            if trend_details.get('alignment_5m') == 'bullish':
                bullish_signals += 2
            elif trend_details.get('alignment_5m') == 'bearish':
                bearish_signals += 2
            
            if trend_details.get('alignment_15m') == 'bullish':
                bullish_signals += 1
            elif trend_details.get('alignment_15m') == 'bearish':
                bearish_signals += 1
            
            # Check VWAP position
            if vwap_details.get('position_bias') == 'bullish':
                bullish_signals += 1
            elif vwap_details.get('position_bias') == 'bearish':
                bearish_signals += 1
            
            # Check market structure
            structure = structure_details.get('structure', '')
            if 'bullish' in structure or structure == 'trending':
                bullish_signals += 1
            elif 'bearish' in structure:
                bearish_signals += 1
            
            # Check momentum
            rsi = momentum_details.get('rsi', 50)
            if rsi > 55:
                bullish_signals += 1
            elif rsi < 45:
                bearish_signals += 1
            
            # Determine bias
            if bullish_signals > bearish_signals + 1:
                return 'BULLISH'
            elif bearish_signals > bullish_signals + 1:
                return 'BEARISH'
            else:
                return 'NEUTRAL'
                
        except Exception as e:
            logger.error(f"Error determining market bias: {e}")
            return 'NEUTRAL'
