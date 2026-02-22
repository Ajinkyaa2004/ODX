"""
Prompt templates for AI reasoning generation
"""

SYSTEM_PROMPT = """You are an expert options trading analyst specializing in NIFTY and BANKNIFTY intraday trading.

Your role is to:
- Explain deterministic scoring outcomes from a quantitative trading system
- Provide clear, factual analysis of existing data
- Identify key strengths and risks in trade setups
- Be concise, structured, and actionable

Important constraints:
- You NEVER generate trade signals yourself
- You ONLY explain and contextualize existing analysis results
- You do NOT contradict the deterministic scores provided
- You provide balanced perspective on both strengths and risks
- You are concise (2-3 sentences for reasoning)

Output Format:
Return ONLY valid JSON matching this exact structure:
{
  "trade_reasoning": "2-3 sentence explanation of the setup",
  "key_strengths": ["strength 1", "strength 2", "strength 3"],
  "key_risks": ["risk 1", "risk 2", "risk 3"],
  "invalidation_condition": "Clear condition that would invalidate this setup",
  "confidence_level": "HIGH or MEDIUM or LOW",
  "suggested_action": "Specific actionable suggestion for the trader"
}
"""


def build_user_prompt(eval_data) -> str:
    """
    Build comprehensive user prompt from evaluation data
    
    Args:
        eval_data: EvaluationInput model instance
        
    Returns:
        Formatted prompt string
    """
    
    strike_info = ""
    if eval_data.recommended_strike and eval_data.option_type:
        strike_info = f"\nRECOMMENDED STRIKE: {eval_data.recommended_strike} {eval_data.option_type}"
    
    prompt = f"""Analyze this options trade setup for {eval_data.symbol}:

OVERALL ASSESSMENT:
- Setup Score: {eval_data.setup_score:.1f}/10 (Threshold: {eval_data.threshold})
- No-Trade Score: {eval_data.no_trade_score:.1f}/10 (Threshold: {eval_data.no_trade_threshold})
- Decision: {eval_data.decision}

COMPONENT BREAKDOWN:
- Trend: {eval_data.trend_score:.1f}/10 ({eval_data.trend_direction})
- VWAP: {eval_data.vwap_score:.1f}/10 ({eval_data.vwap_status})
- Structure: {eval_data.structure_score:.1f}/10
- OI Confirmation: {eval_data.oi_score:.1f}/10 ({eval_data.oi_pattern})
- Volatility: {eval_data.volatility_score:.1f}/10 (Regime: {eval_data.volatility_regime})
- Momentum: {eval_data.momentum_score:.1f}/10
- Market Internals: {eval_data.internal_score:.1f}/10

ADVANCED FILTERS:
- Time Risk: {eval_data.time_risk}
- Fake Breakout Risk: {eval_data.fake_breakout_risk}
- Volatility Regime: {eval_data.volatility_regime}{strike_info}

Provide a comprehensive analysis with:
1. Trade reasoning that explains WHY the scores led to this decision (2-3 sentences)
2. Key strengths - identify 2-3 strongest aspects supporting the trade
3. Key risks - identify 2-3 main concerns or risks
4. Invalidation condition - specific price/indicator level that would invalidate the setup
5. Confidence level (HIGH if scores are decisive, MEDIUM if mixed, LOW if marginal)
6. Suggested action - specific, actionable guidance

Remember: Be factual, concise, and balanced. Output ONLY valid JSON."""
    
    return prompt


def build_lightweight_prompt(symbol: str, setup_score: float, decision: str, 
                            trend_direction: str, oi_pattern: str) -> str:
    """
    Build simplified prompt for quick reasoning (fallback)
    
    Args:
        symbol: Trading symbol
        setup_score: Overall setup score
        decision: TRADE/NO_TRADE
        trend_direction: Trend direction
        oi_pattern: OI pattern description
        
    Returns:
        Simplified prompt string
    """
    
    prompt = f"""Quick analysis for {symbol}:
- Setup Score: {setup_score:.1f}/10
- Decision: {decision}
- Trend: {trend_direction}
- OI: {oi_pattern}

Provide brief JSON analysis with reasoning, 2 strengths, 2 risks, invalidation, confidence, and action.
Output ONLY valid JSON."""
    
    return prompt


# Example usage for testing
if __name__ == "__main__":
    from app.models import EvaluationInput
    
    test_data = EvaluationInput(
        symbol="NIFTY",
        setup_score=7.5,
        no_trade_score=3.2,
        decision="TRADE",
        threshold=6.5,
        no_trade_threshold=5.0,
        trend_score=8.5,
        trend_direction="BULLISH",
        vwap_score=7.0,
        vwap_status="Above VWAP",
        structure_score=7.5,
        oi_score=8.0,
        oi_pattern="Call buying at support",
        volatility_score=6.5,
        volatility_regime="MODERATE",
        momentum_score=7.8,
        internal_score=7.2,
        time_risk="PRIME_TIME",
        fake_breakout_risk="LOW",
        recommended_strike=22450,
        option_type="CALL"
    )
    
    print("=== SYSTEM PROMPT ===")
    print(SYSTEM_PROMPT)
    print("\n=== USER PROMPT ===")
    print(build_user_prompt(test_data))
