"""
No-Trade Scoring Module for Phase 4
Implements 5 components to identify conditions where trading should be avoided
"""
import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Tuple
from datetime import datetime, time
import logging
import pytz

logger = logging.getLogger(__name__)

# IST Timezone
IST = pytz.timezone('Asia/Kolkata')


class TimeRiskScorer:
    """
    Time-of-Day Risk Scorer (30% weight)
    Penalizes trading during high-risk time periods
    """
    
    def __init__(self):
        self.weight = 0.30
        
    def score(self, timestamp: Optional[datetime] = None) -> Tuple[float, Dict]:
        """
        Calculate time risk score (0-10, higher = more risk)
        
        Args:
            timestamp: Current time (defaults to now)
            
        Returns:
            Tuple of (score, details)
        """
        try:
            if timestamp is None:
                timestamp = datetime.now(IST)
            elif timestamp.tzinfo is None:
                timestamp = IST.localize(timestamp)
            else:
                timestamp = timestamp.astimezone(IST)
            
            current_time = timestamp.time()
            details = {'current_time': timestamp.strftime('%H:%M:%S')}
            
            # Define time periods
            market_open = time(9, 15)
            noise_end = time(9, 30)
            chop_start = time(11, 0)
            chop_end = time(12, 30)
            late_session = time(15, 0)
            market_close = time(15, 30)
            
            # Opening noise (9:15-9:30) - HIGHEST RISK
            if market_open <= current_time < noise_end:
                score = 10.0
                details['category'] = 'OPENING_NOISE'
                details['interpretation'] = 'Extreme risk - Opening volatility'
                
            # Chop hour (11:00-12:30) - HIGH RISK
            elif chop_start <= current_time < chop_end:
                score = 7.0
                details['category'] = 'CHOP_HOUR'
                details['interpretation'] = 'High risk - Sideways movement likely'
                
            # Late session (3:00-3:30) - MODERATE RISK
            elif late_session <= current_time < market_close:
                score = 6.0
                details['category'] = 'LATE_SESSION'
                details['interpretation'] = 'Moderate risk - End of day volatility'
                
            # Prime trading time (9:30-11:00, 12:30-3:00) - LOW RISK
            elif (noise_end <= current_time < chop_start) or (chop_end <= current_time < late_session):
                score = 2.0
                details['category'] = 'PRIME_TIME'
                details['interpretation'] = 'Low risk - Ideal trading time'
                
            # Before open or after close - NO TRADING
            else:
                score = 10.0
                details['category'] = 'MARKET_CLOSED'
                details['interpretation'] = 'Market closed'
            
            details['score'] = round(score, 2)
            return score, details
            
        except Exception as e:
            logger.error(f"Error calculating time risk: {e}", exc_info=True)
            return 5.0, {"error": str(e), "category": "UNKNOWN"}


class ChopDetector:
    """
    Chop/Sideways Market Detector (25% weight)
    Detects consolidation and low-momentum conditions
    """
    
    def __init__(self):
        self.weight = 0.25
        
    def score(
        self,
        price_history: List[float],
        high_history: List[float],
        low_history: List[float],
        volume_history: Optional[List[float]] = None
    ) -> Tuple[float, Dict]:
        """
        Calculate chop score (0-10, higher = more choppy)
        
        Args:
            price_history: Recent closing prices
            high_history: Recent highs
            low_history: Recent lows
            volume_history: Recent volumes (optional)
            
        Returns:
            Tuple of (score, details)
        """
        try:
            score = 0.0
            details = {}
            
            if len(price_history) < 20:
                return 5.0, {"error": "Insufficient data", "chop_detected": True}
            
            prices = np.array(price_history[-20:])
            highs = np.array(high_history[-20:])
            lows = np.array(low_history[-20:])
            
            # Component 1: Range compression (0-4 points)
            recent_range = np.max(highs[-5:]) - np.min(lows[-5:])
            overall_range = np.max(highs) - np.min(lows)
            
            if overall_range > 0:
                range_ratio = recent_range / overall_range
                details['range_ratio'] = round(range_ratio, 3)
                
                if range_ratio < 0.3:  # Very narrow range
                    score += 4.0
                    details['range_status'] = 'very_compressed'
                elif range_ratio < 0.5:
                    score += 3.0
                    details['range_status'] = 'compressed'
                elif range_ratio < 0.7:
                    score += 1.0
                    details['range_status'] = 'normal'
                else:
                    score += 0.0
                    details['range_status'] = 'expanding'
            
            # Component 2: Price oscillations (0-3 points)
            price_changes = np.diff(prices)
            direction_changes = np.sum(np.diff(np.sign(price_changes)) != 0)
            oscillation_ratio = direction_changes / len(price_changes) if len(price_changes) > 0 else 0
            details['oscillation_ratio'] = round(oscillation_ratio, 3)
            
            if oscillation_ratio > 0.7:
                score += 3.0
                details['oscillation_status'] = 'high_chop'
            elif oscillation_ratio > 0.5:
                score += 2.0
                details['oscillation_status'] = 'moderate_chop'
            else:
                score += 0.0
                details['oscillation_status'] = 'trending'
            
            # Component 3: Standard deviation (0-3 points)
            std_dev = np.std(prices)
            mean_price = np.mean(prices)
            cv = (std_dev / mean_price) * 100 if mean_price > 0 else 0  # Coefficient of variation
            details['coefficient_variation'] = round(cv, 3)
            
            if cv < 0.3:  # Very low volatility = chop
                score += 3.0
                details['volatility_status'] = 'very_low'
            elif cv < 0.5:
                score += 2.0
                details['volatility_status'] = 'low'
            else:
                score += 0.0
                details['volatility_status'] = 'normal'
            
            # Normalize to 0-10
            normalized_score = min(10.0, max(0.0, score))
            details['score'] = round(normalized_score, 2)
            
            # Interpretation
            if normalized_score >= 7:
                details['interpretation'] = 'Strong chop detected - avoid trading'
            elif normalized_score >= 5:
                details['interpretation'] = 'Moderate chop - be cautious'
            else:
                details['interpretation'] = 'Trending conditions - safe to trade'
            
            return normalized_score, details
            
        except Exception as e:
            logger.error(f"Error detecting chop: {e}", exc_info=True)
            return 5.0, {"error": str(e), "chop_detected": True}


class ResistanceProximityScorer:
    """
    Support/Resistance Proximity Scorer (20% weight)
    Penalizes trading near key levels (higher rejection risk)
    """
    
    def __init__(self):
        self.weight = 0.20
        
    def score(
        self,
        current_price: float,
        high_history: List[float],
        low_history: List[float]
    ) -> Tuple[float, Dict]:
        """
        Calculate resistance proximity score (0-10, higher = closer to levels)
        
        Args:
            current_price: Current market price
            high_history: Recent highs
            low_history: Recent lows
            
        Returns:
            Tuple of (score, details)
        """
        try:
            score = 0.0
            details = {}
            
            if len(high_history) < 20 or len(low_history) < 20:
                return 5.0, {"error": "Insufficient data"}
            
            highs = np.array(high_history[-20:])
            lows = np.array(low_history[-20:])
            
            # Identify key resistance (max high)
            resistance = np.max(highs)
            details['resistance'] = round(resistance, 2)
            
            # Identify key support (min low)
            support = np.min(lows)
            details['support'] = round(support, 2)
            
            # Calculate distance from resistance
            if current_price < resistance:
                resistance_distance_pct = ((resistance - current_price) / current_price) * 100
            else:
                resistance_distance_pct = ((current_price - resistance) / current_price) * 100
            
            details['resistance_distance_pct'] = round(resistance_distance_pct, 3)
            
            # Calculate distance from support
            if current_price > support:
                support_distance_pct = ((current_price - support) / current_price) * 100
            else:
                support_distance_pct = ((support - current_price) / current_price) * 100
            
            details['support_distance_pct'] = round(support_distance_pct, 3)
            
            # Score based on proximity (closer = higher risk)
            min_distance = min(resistance_distance_pct, support_distance_pct)
            details['min_distance_pct'] = round(min_distance, 3)
            
            if min_distance < 0.5:  # Within 0.5%
                score = 9.0
                details['proximity_status'] = 'very_close'
                details['interpretation'] = 'Extreme risk - At key level'
            elif min_distance < 1.0:  # Within 1%
                score = 7.0
                details['proximity_status'] = 'close'
                details['interpretation'] = 'High risk - Near key level'
            elif min_distance < 1.5:  # Within 1.5%
                score = 5.0
                details['proximity_status'] = 'moderate'
                details['interpretation'] = 'Moderate risk - Approaching level'
            else:
                score = 2.0
                details['proximity_status'] = 'far'
                details['interpretation'] = 'Low risk - Away from levels'
            
            details['score'] = round(score, 2)
            return score, details
            
        except Exception as e:
            logger.error(f"Error calculating resistance proximity: {e}", exc_info=True)
            return 5.0, {"error": str(e)}


class VolatilityCompressionScorer:
    """
    Volatility Compression Scorer (15% weight)
    Detects extremely compressed volatility (breakout risk)
    """
    
    def __init__(self):
        self.weight = 0.15
        
    def score(
        self,
        volatility_details: Optional[Dict]
    ) -> Tuple[float, Dict]:
        """
        Calculate volatility compression score (0-10, higher = more compressed)
        
        Args:
            volatility_details: Details from VolatilityScorer
            
        Returns:
            Tuple of (score, details)
        """
        try:
            score = 0.0
            details = {}
            
            if not volatility_details or 'regime' not in volatility_details:
                return 5.0, {"error": "No volatility data", "status": "unknown"}
            
            regime = volatility_details.get('regime', 'NORMAL')
            atr_expansion_pct = volatility_details.get('atr_expansion_pct', 0)
            
            details['regime'] = regime
            details['atr_expansion_pct'] = round(atr_expansion_pct, 2)
            
            # Score based on regime
            if regime == 'COMPRESSION':
                if atr_expansion_pct < -20:  # Extreme compression
                    score = 9.0
                    details['compression_level'] = 'extreme'
                    details['interpretation'] = 'Extreme compression - breakout imminent'
                elif atr_expansion_pct < -10:  # Moderate compression
                    score = 6.0
                    details['compression_level'] = 'moderate'
                    details['interpretation'] = 'Moderate compression - watch for breakout'
                else:
                    score = 3.0
                    details['compression_level'] = 'slight'
                    details['interpretation'] = 'Slight compression'
                    
            elif regime == 'EXPANSION':
                score = 4.0
                details['compression_level'] = 'none'
                details['interpretation'] = 'High volatility - risk increased'
                
            else:  # NORMAL
                score = 2.0
                details['compression_level'] = 'none'
                details['interpretation'] = 'Normal volatility'
            
            details['score'] = round(score, 2)
            return score, details
            
        except Exception as e:
            logger.error(f"Error calculating volatility compression: {e}", exc_info=True)
            return 5.0, {"error": str(e), "status": "error"}


class ConsecutiveLossGuard:
    """
    Consecutive Loss Guard (10% weight)
    Penalizes trading after consecutive losses (future enhancement)
    """
    
    def __init__(self):
        self.weight = 0.10
        
    def score(
        self,
        consecutive_losses: int = 0,
        recent_trades: Optional[List[Dict]] = None
    ) -> Tuple[float, Dict]:
        """
        Calculate consecutive loss score (0-10, higher = more losses)
        
        Args:
            consecutive_losses: Number of consecutive losing trades
            recent_trades: Recent trade history (future use)
            
        Returns:
            Tuple of (score, details)
        """
        try:
            score = 0.0
            details = {'consecutive_losses': consecutive_losses}
            
            # Score based on consecutive losses
            if consecutive_losses >= 3:
                score = 10.0
                details['guard_level'] = 'critical'
                details['interpretation'] = 'Trading blocked - Too many consecutive losses'
            elif consecutive_losses >= 2:
                score = 7.0
                details['guard_level'] = 'high'
                details['interpretation'] = 'High caution - 2 consecutive losses'
            elif consecutive_losses >= 1:
                score = 4.0
                details['guard_level'] = 'moderate'
                details['interpretation'] = 'Moderate caution - Recent loss'
            else:
                score = 0.0
                details['guard_level'] = 'normal'
                details['interpretation'] = 'No recent losses'
            
            details['score'] = round(score, 2)
            return score, details
            
        except Exception as e:
            logger.error(f"Error calculating consecutive loss guard: {e}", exc_info=True)
            return 0.0, {"error": str(e), "guard_level": "error"}


class NoTradeScorer:
    """
    Aggregate No-Trade Scorer
    Combines all 5 components to determine if trading should be avoided
    """
    
    def __init__(self):
        self.time_risk_scorer = TimeRiskScorer()
        self.chop_detector = ChopDetector()
        self.resistance_proximity_scorer = ResistanceProximityScorer()
        self.volatility_compression_scorer = VolatilityCompressionScorer()
        self.consecutive_loss_guard = ConsecutiveLossGuard()
        
        self.weights = {
            'time_risk': 0.30,
            'chop_detection': 0.25,
            'resistance_proximity': 0.20,
            'volatility_compression': 0.15,
            'consecutive_loss': 0.10
        }
        
    def calculate_no_trade_score(
        self,
        symbol: str,
        current_price: float,
        price_history: List[float],
        high_history: List[float],
        low_history: List[float],
        volatility_details: Optional[Dict] = None,
        timestamp: Optional[datetime] = None,
        consecutive_losses: int = 0
    ) -> Dict:
        """
        Calculate complete no-trade score
        
        Returns:
            Dictionary with no_trade_score, components, and interpretation
        """
        try:
            start_time = datetime.now()
            
            # Calculate individual scores
            time_risk, time_details = self.time_risk_scorer.score(timestamp)
            chop_score, chop_details = self.chop_detector.score(
                price_history, high_history, low_history
            )
            resistance_score, resistance_details = self.resistance_proximity_scorer.score(
                current_price, high_history, low_history
            )
            volatility_compression, vol_comp_details = self.volatility_compression_scorer.score(
                volatility_details
            )
            consecutive_loss, loss_details = self.consecutive_loss_guard.score(
                consecutive_losses
            )
            
            # Calculate weighted components
            components = {
                'time_risk': {
                    'score': round(time_risk, 2),
                    'weight': self.weights['time_risk'],
                    'weighted': round(time_risk * self.weights['time_risk'], 4),
                    'details': time_details
                },
                'chop_detection': {
                    'score': round(chop_score, 2),
                    'weight': self.weights['chop_detection'],
                    'weighted': round(chop_score * self.weights['chop_detection'], 4),
                    'details': chop_details
                },
                'resistance_proximity': {
                    'score': round(resistance_score, 2),
                    'weight': self.weights['resistance_proximity'],
                    'weighted': round(resistance_score * self.weights['resistance_proximity'], 4),
                    'details': resistance_details
                },
                'volatility_compression': {
                    'score': round(volatility_compression, 2),
                    'weight': self.weights['volatility_compression'],
                    'weighted': round(volatility_compression * self.weights['volatility_compression'], 4),
                    'details': vol_comp_details
                },
                'consecutive_loss': {
                    'score': round(consecutive_loss, 2),
                    'weight': self.weights['consecutive_loss'],
                    'weighted': round(consecutive_loss * self.weights['consecutive_loss'], 4),
                    'details': loss_details
                }
            }
            
            # Calculate total no-trade score
            no_trade_score = sum(comp['weighted'] for comp in components.values())
            no_trade_score = round(no_trade_score, 2)
            
            # Overall interpretation
            if no_trade_score >= 7.0:
                interpretation = 'DO NOT TRADE - High risk conditions'
                risk_level = 'HIGH'
            elif no_trade_score >= 5.0:
                interpretation = 'CAUTION - Moderate risk conditions'
                risk_level = 'MODERATE'
            elif no_trade_score >= 3.0:
                interpretation = 'WATCH - Some risk factors present'
                risk_level = 'LOW'
            else:
                interpretation = 'SAFE - Low risk conditions'
                risk_level = 'MINIMAL'
            
            # Calculate evaluation time
            evaluation_time = (datetime.now() - start_time).total_seconds()
            
            return {
                'symbol': symbol,
                'timestamp': datetime.utcnow(),
                'no_trade_score': no_trade_score,
                'components': components,
                'interpretation': interpretation,
                'risk_level': risk_level,
                'evaluation_time_seconds': round(evaluation_time, 4)
            }
            
        except Exception as e:
            logger.error(f"Error calculating no-trade score: {e}", exc_info=True)
            return {
                'symbol': symbol,
                'timestamp': datetime.utcnow(),
                'no_trade_score': 10.0,  # Fail-safe: block trading on error
                'components': {},
                'interpretation': 'ERROR - Trading blocked for safety',
                'risk_level': 'CRITICAL',
                'evaluation_time_seconds': 0.0,
                'error': str(e)
            }
