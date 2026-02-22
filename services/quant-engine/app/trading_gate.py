"""
Trading Gate Module for Phase 4
Implements trade gating logic with multiple risk modes
"""
from typing import Dict, Optional
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class RiskMode(Enum):
    """Risk mode definitions"""
    CONSERVATIVE = "CONSERVATIVE"
    BALANCED = "BALANCED"
    AGGRESSIVE = "AGGRESSIVE"


class TradeGateConfig:
    """
    Configuration for trade gating thresholds
    """
    
    # Setup score thresholds (minimum required)
    SETUP_THRESHOLDS = {
        RiskMode.CONSERVATIVE: 8.0,
        RiskMode.BALANCED: 7.0,
        RiskMode.AGGRESSIVE: 6.0
    }
    
    # No-trade score thresholds (maximum allowed)
    NO_TRADE_THRESHOLDS = {
        RiskMode.CONSERVATIVE: 4.0,
        RiskMode.BALANCED: 6.0,
        RiskMode.AGGRESSIVE: 7.0
    }
    
    # Volatility regime filters
    ALLOWED_VOLATILITY_REGIMES = {
        RiskMode.CONSERVATIVE: ['NORMAL'],
        RiskMode.BALANCED: ['NORMAL', 'COMPRESSION'],
        RiskMode.AGGRESSIVE: ['NORMAL', 'COMPRESSION', 'EXPANSION']
    }
    
    # Time filters
    BLOCK_OPENING_NOISE = {
        RiskMode.CONSERVATIVE: True,
        RiskMode.BALANCED: True,
        RiskMode.AGGRESSIVE: False  # Aggressive traders can trade opening
    }
    
    BLOCK_CHOP_HOUR = {
        RiskMode.CONSERVATIVE: True,
        RiskMode.BALANCED: False,
        RiskMode.AGGRESSIVE: False
    }


class TradingGate:
    """
    Trade Gating System
    Determines if trading is allowed based on multiple criteria
    """
    
    def __init__(self, risk_mode: RiskMode = RiskMode.BALANCED):
        """
        Args:
            risk_mode: Trading risk mode
        """
        self.risk_mode = risk_mode
        self.config = TradeGateConfig()
        
    def set_risk_mode(self, mode: str) -> bool:
        """
        Set risk mode
        
        Args:
            mode: "CONSERVATIVE", "BALANCED", or "AGGRESSIVE"
            
        Returns:
            True if mode was set successfully
        """
        try:
            self.risk_mode = RiskMode[mode.upper()]
            logger.info(f"Risk mode set to: {self.risk_mode.value}")
            return True
        except KeyError:
            logger.error(f"Invalid risk mode: {mode}")
            return False
    
    def evaluate_trade_decision(
        self,
        setup_score: float,
        no_trade_score: float,
        volatility_regime: Optional[str] = None,
        time_category: Optional[str] = None,
        fake_breakout_risk: bool = False,
        oi_analysis: Optional[Dict] = None
    ) -> Dict:
        """
        Evaluate if trading is allowed
        
        Args:
            setup_score: Setup score (0-10)
            no_trade_score: No-trade score (0-10)
            volatility_regime: Current volatility regime
            time_category: Time of day category
            fake_breakout_risk: Whether fake breakout is detected
            oi_analysis: OI analysis data
            
        Returns:
            Dictionary with trade_allowed status and detailed reasoning
        """
        try:
            # Initialize decision
            trade_allowed = True
            blocking_reasons = []
            warnings = []
            
            # Get thresholds for current risk mode
            setup_threshold = self.config.SETUP_THRESHOLDS[self.risk_mode]
            no_trade_threshold = self.config.NO_TRADE_THRESHOLDS[self.risk_mode]
            
            # Rule 1: Setup score must meet threshold
            if setup_score < setup_threshold:
                trade_allowed = False
                blocking_reasons.append(
                    f"Setup score {setup_score:.2f} below threshold {setup_threshold:.2f}"
                )
            
            # Rule 2: No-trade score must be below threshold
            if no_trade_score > no_trade_threshold:
                trade_allowed = False
                blocking_reasons.append(
                    f"No-trade score {no_trade_score:.2f} above threshold {no_trade_threshold:.2f}"
                )
            
            # Rule 3: Volatility regime check
            if volatility_regime:
                allowed_regimes = self.config.ALLOWED_VOLATILITY_REGIMES[self.risk_mode]
                if volatility_regime not in allowed_regimes:
                    if self.risk_mode == RiskMode.CONSERVATIVE:
                        trade_allowed = False
                        blocking_reasons.append(
                            f"Volatility regime '{volatility_regime}' not allowed in CONSERVATIVE mode"
                        )
                    else:
                        warnings.append(
                            f"Volatility regime '{volatility_regime}' requires extra caution"
                        )
            
            # Rule 4: Time-of-day filters
            if time_category:
                if time_category == 'OPENING_NOISE':
                    if self.config.BLOCK_OPENING_NOISE[self.risk_mode]:
                        trade_allowed = False
                        blocking_reasons.append("Trading blocked during opening noise period")
                    else:
                        warnings.append("Opening period - high volatility expected")
                
                elif time_category == 'CHOP_HOUR':
                    if self.config.BLOCK_CHOP_HOUR[self.risk_mode]:
                        trade_allowed = False
                        blocking_reasons.append("Trading blocked during chop hour")
                    else:
                        warnings.append("Chop hour - expect sideways movement")
                
                elif time_category == 'MARKET_CLOSED':
                    trade_allowed = False
                    blocking_reasons.append("Market is closed")
            
            # Rule 5: Fake breakout detection
            if fake_breakout_risk:
                if self.risk_mode == RiskMode.CONSERVATIVE:
                    trade_allowed = False
                    blocking_reasons.append("Fake breakout risk detected")
                else:
                    warnings.append("Potential fake breakout detected - be cautious")
            
            # Rule 6: OI divergence check (for Conservative mode)
            if oi_analysis and self.risk_mode == RiskMode.CONSERVATIVE:
                oi_trend = oi_analysis.get('oiTrend', 'NEUTRAL')
                pcr = oi_analysis.get('pcr', 1.0)
                
                # Extreme PCR values
                if pcr > 2.5 or pcr < 0.4:
                    warnings.append(f"Extreme PCR value {pcr:.2f} - market uncertainty")
            
            # Determine decision status
            if trade_allowed:
                if warnings:
                    decision = "TRADE_ALLOWED_WITH_CAUTION"
                    status = "ALLOWED"
                else:
                    decision = "TRADE_ALLOWED"
                    status = "ALLOWED"
            else:
                decision = "TRADE_BLOCKED"
                status = "BLOCKED"
            
            # Calculate confidence level
            score_margin = setup_score - setup_threshold
            no_trade_margin = no_trade_threshold - no_trade_score
            
            if trade_allowed:
                confidence = min(100, max(0, (score_margin + no_trade_margin) * 10))
            else:
                confidence = 0
            
            return {
                'trade_allowed': trade_allowed,
                'decision': decision,
                'status': status,
                'confidence': round(confidence, 2),
                'risk_mode': self.risk_mode.value,
                'thresholds': {
                    'setup_score': setup_threshold,
                    'no_trade_score': no_trade_threshold
                },
                'scores': {
                    'setup_score': round(setup_score, 2),
                    'no_trade_score': round(no_trade_score, 2),
                    'setup_margin': round(score_margin, 2),
                    'no_trade_margin': round(no_trade_margin, 2)
                },
                'blocking_reasons': blocking_reasons,
                'warnings': warnings,
                'volatility_regime': volatility_regime,
                'time_category': time_category,
                'fake_breakout_risk': fake_breakout_risk
            }
            
        except Exception as e:
            logger.error(f"Error evaluating trade decision: {e}", exc_info=True)
            # Fail-safe: block trading on error
            return {
                'trade_allowed': False,
                'decision': 'ERROR',
                'status': 'BLOCKED',
                'confidence': 0,
                'risk_mode': self.risk_mode.value,
                'blocking_reasons': [f"System error: {str(e)}"],
                'warnings': [],
                'error': str(e)
            }
    
    def get_risk_mode_info(self) -> Dict:
        """
        Get information about current risk mode
        
        Returns:
            Dictionary with risk mode details
        """
        return {
            'current_mode': self.risk_mode.value,
            'setup_threshold': self.config.SETUP_THRESHOLDS[self.risk_mode],
            'no_trade_threshold': self.config.NO_TRADE_THRESHOLDS[self.risk_mode],
            'allowed_volatility_regimes': self.config.ALLOWED_VOLATILITY_REGIMES[self.risk_mode],
            'blocks_opening_noise': self.config.BLOCK_OPENING_NOISE[self.risk_mode],
            'blocks_chop_hour': self.config.BLOCK_CHOP_HOUR[self.risk_mode],
            'description': self._get_mode_description()
        }
    
    def _get_mode_description(self) -> str:
        """Get description of current risk mode"""
        descriptions = {
            RiskMode.CONSERVATIVE: "Strict filtering - Only highest quality setups in normal volatility",
            RiskMode.BALANCED: "Moderate filtering - Good risk-reward balance for most traders",
            RiskMode.AGGRESSIVE: "Minimal filtering - More opportunities but higher risk"
        }
        return descriptions.get(self.risk_mode, "Unknown mode")
    
    @staticmethod
    def get_all_risk_modes() -> Dict:
        """
        Get information about all available risk modes
        
        Returns:
            Dictionary with all risk mode configurations
        """
        config = TradeGateConfig()
        
        return {
            mode.value: {
                'setup_threshold': config.SETUP_THRESHOLDS[mode],
                'no_trade_threshold': config.NO_TRADE_THRESHOLDS[mode],
                'allowed_volatility_regimes': config.ALLOWED_VOLATILITY_REGIMES[mode],
                'blocks_opening_noise': config.BLOCK_OPENING_NOISE[mode],
                'blocks_chop_hour': config.BLOCK_CHOP_HOUR[mode]
            }
            for mode in RiskMode
        }


# Global trading gate instance
_trading_gate = TradingGate(risk_mode=RiskMode.BALANCED)


def get_trading_gate() -> TradingGate:
    """Get the global trading gate instance"""
    return _trading_gate


def set_global_risk_mode(mode: str) -> bool:
    """Set the global risk mode"""
    return _trading_gate.set_risk_mode(mode)
