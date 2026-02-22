"""
AI Reasoning Service - Groq API Integration
"""

import json
import logging
import time
from typing import Optional
from groq import Groq, APIError, RateLimitError, APITimeoutError
from app.config import settings
from app.models import EvaluationInput, AIReasoning
from app.prompts import SYSTEM_PROMPT, build_user_prompt, build_lightweight_prompt

logger = logging.getLogger(__name__)


class ReasoningService:
    """Service for generating AI-powered trade reasoning using Groq"""
    
    def __init__(self):
        """Initialize Groq client"""
        if not settings.groq_api_key:
            logger.warning("Groq API key not configured. AI reasoning will use mock data.")
            self.client = None
        else:
            self.client = Groq(api_key=settings.groq_api_key)
            logger.info(f"Groq client initialized with model: {settings.groq_model}")
    
    async def generate_reasoning(
        self, 
        eval_data: EvaluationInput,
        use_lightweight: bool = False
    ) -> AIReasoning:
        """
        Generate AI reasoning from evaluation data
        
        Args:
            eval_data: Evaluation input data
            use_lightweight: Use simplified prompt (for speed)
            
        Returns:
            AIReasoning object with generated insights
            
        Raises:
            Exception: If generation fails after retries
        """
        start_time = time.time()
        
        # If no API key, return mock data
        if not self.client:
            logger.info("Using mock reasoning (no API key)")
            return self._generate_mock_reasoning(eval_data)
        
        # Build prompt
        if use_lightweight:
            user_prompt = build_lightweight_prompt(
                eval_data.symbol,
                eval_data.setup_score,
                eval_data.decision,
                eval_data.trend_direction,
                eval_data.oi_pattern
            )
        else:
            user_prompt = build_user_prompt(eval_data)
        
        # Try to generate with retries
        max_retries = 3
        for attempt in range(max_retries):
            try:
                logger.info(f"Generating reasoning for {eval_data.symbol} (attempt {attempt + 1}/{max_retries})")
                
                # Call Groq API
                chat_completion = self.client.chat.completions.create(
                    messages=[
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": user_prompt}
                    ],
                    model=settings.groq_model,
                    temperature=0.3,  # Low temperature for consistent, factual output
                    max_tokens=1000,
                    top_p=0.9,
                    response_format={"type": "json_object"}  # Force JSON output
                )
                
                # Parse response
                response_text = chat_completion.choices[0].message.content
                reasoning_data = json.loads(response_text)
                
                # Calculate generation time
                generation_time_ms = int((time.time() - start_time) * 1000)
                
                # Validate and create AIReasoning object
                reasoning = AIReasoning(
                    trade_reasoning=reasoning_data.get("trade_reasoning", ""),
                    key_strengths=reasoning_data.get("key_strengths", []),
                    key_risks=reasoning_data.get("key_risks", []),
                    invalidation_condition=reasoning_data.get("invalidation_condition", ""),
                    confidence_level=reasoning_data.get("confidence_level", "MEDIUM"),
                    suggested_action=reasoning_data.get("suggested_action", ""),
                    model=settings.groq_model,
                    generation_time_ms=generation_time_ms
                )
                
                logger.info(f"Successfully generated reasoning in {generation_time_ms}ms")
                return reasoning
                
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse JSON response: {e}")
                logger.error(f"Response text: {response_text}")
                if attempt == max_retries - 1:
                    return self._generate_mock_reasoning(eval_data, error="JSON parse error")
                continue
                
            except RateLimitError as e:
                logger.warning(f"Rate limit hit: {e}")
                if attempt < max_retries - 1:
                    wait_time = 2 ** attempt  # Exponential backoff
                    logger.info(f"Waiting {wait_time}s before retry...")
                    time.sleep(wait_time)
                    continue
                else:
                    return self._generate_mock_reasoning(eval_data, error="Rate limit exceeded")
                    
            except APITimeoutError as e:
                logger.error(f"API timeout: {e}")
                if attempt < max_retries - 1:
                    continue
                else:
                    return self._generate_mock_reasoning(eval_data, error="API timeout")
                    
            except APIError as e:
                logger.error(f"Groq API error: {e}")
                if attempt < max_retries - 1:
                    continue
                else:
                    return self._generate_mock_reasoning(eval_data, error=str(e))
                    
            except Exception as e:
                logger.error(f"Unexpected error generating reasoning: {e}")
                if attempt < max_retries - 1:
                    continue
                else:
                    return self._generate_mock_reasoning(eval_data, error=str(e))
        
        # Should not reach here, but fallback to mock
        return self._generate_mock_reasoning(eval_data, error="Max retries exceeded")
    
    def _generate_mock_reasoning(
        self, 
        eval_data: EvaluationInput,
        error: Optional[str] = None
    ) -> AIReasoning:
        """
        Generate mock reasoning as fallback
        
        Args:
            eval_data: Evaluation input data
            error: Error message if this is fallback due to error
            
        Returns:
            Mock AIReasoning object
        """
        logger.info(f"Generating mock reasoning for {eval_data.symbol}")
        
        # Determine mock confidence based on scores
        if eval_data.setup_score >= 7.5:
            confidence = "HIGH"
        elif eval_data.setup_score >= 6.0:
            confidence = "MEDIUM"
        else:
            confidence = "LOW"
        
        # Build mock reasoning based on actual data
        direction = eval_data.trend_direction.lower()
        decision_text = "favorable" if eval_data.decision == "TRADE" else "unfavorable"
        
        mock_reasoning = AIReasoning(
            trade_reasoning=f"The {eval_data.symbol} setup shows {decision_text} conditions with {direction} trend alignment (score: {eval_data.setup_score:.1f}/10). {eval_data.oi_pattern}. The {eval_data.volatility_regime.lower()} volatility regime and {eval_data.time_risk.lower().replace('_', ' ')} timing support this assessment.",
            key_strengths=[
                f"Trend score of {eval_data.trend_score:.1f}/10 indicates {direction} momentum",
                f"OI analysis shows: {eval_data.oi_pattern}",
                f"Trading during {eval_data.time_risk.lower().replace('_', ' ')} window"
            ],
            key_risks=[
                f"No-trade score at {eval_data.no_trade_score:.1f}/10 suggests some caution",
                f"Volatility regime is {eval_data.volatility_regime.lower()}",
                f"Fake breakout risk: {eval_data.fake_breakout_risk.lower()}"
            ],
            invalidation_condition=f"Setup invalidated if price breaks key {eval_data.vwap_status.lower()} level with volume confirmation",
            confidence_level=confidence,
            suggested_action=f"Monitor {eval_data.symbol} {'entry' if eval_data.decision == 'TRADE' else 'from sidelines'} at recommended strike {eval_data.recommended_strike} {eval_data.option_type}" if eval_data.recommended_strike else f"{'Consider entry' if eval_data.decision == 'TRADE' else 'Stay on sidelines'} based on score of {eval_data.setup_score:.1f}/10",
            model="mock-reasoning-v1",
            generation_time_ms=10
        )
        
        if error:
            logger.warning(f"Mock reasoning generated due to error: {error}")
        
        return mock_reasoning


# Singleton instance
_reasoning_service: Optional[ReasoningService] = None


def get_reasoning_service() -> ReasoningService:
    """Get or create reasoning service singleton"""
    global _reasoning_service
    if _reasoning_service is None:
        _reasoning_service = ReasoningService()
    return _reasoning_service
