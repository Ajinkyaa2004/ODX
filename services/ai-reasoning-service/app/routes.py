"""
API Routes for AI Reasoning Service
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
import logging
from app.models import (
    ReasoningRequest, 
    ReasoningResponse, 
    EvaluationInput,
    AIReasoning
)
from app.service import get_reasoning_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ai", tags=["AI Reasoning"])


@router.post("/generate-reasoning", response_model=ReasoningResponse)
async def generate_reasoning(request: ReasoningRequest):
    """
    Generate AI reasoning for a trade setup
    
    - **evaluation_data**: Complete evaluation data from quant engine
    - **force_regenerate**: Bypass cache and regenerate (default: False)
    
    Returns structured AI reasoning with trade explanation, strengths, risks, and suggestions.
    """
    try:
        logger.info(f"Generating reasoning for {request.evaluation_data.symbol}")
        
        # Get reasoning service
        reasoning_service = get_reasoning_service()
        
        # Generate reasoning
        reasoning = await reasoning_service.generate_reasoning(
            request.evaluation_data,
            use_lightweight=False
        )
        
        return ReasoningResponse(
            success=True,
            reasoning=reasoning,
            cached=False
        )
        
    except Exception as e:
        logger.error(f"Error generating reasoning: {e}", exc_info=True)
        return ReasoningResponse(
            success=False,
            error=str(e)
        )


@router.post("/quick-reasoning", response_model=ReasoningResponse)
async def generate_quick_reasoning(request: ReasoningRequest):
    """
    Generate quick AI reasoning with simplified prompt (faster)
    
    - **evaluation_data**: Complete evaluation data
    
    Returns lightweight reasoning optimized for speed.
    """
    try:
        logger.info(f"Generating quick reasoning for {request.evaluation_data.symbol}")
        
        # Get reasoning service
        reasoning_service = get_reasoning_service()
        
        # Generate with lightweight prompt
        reasoning = await reasoning_service.generate_reasoning(
            request.evaluation_data,
            use_lightweight=True
        )
        
        return ReasoningResponse(
            success=True,
            reasoning=reasoning,
            cached=False
        )
        
    except Exception as e:
        logger.error(f"Error generating quick reasoning: {e}", exc_info=True)
        return ReasoningResponse(
            success=False,
            error=str(e)
        )


@router.get("/test-connection")
async def test_groq_connection():
    """
    Test Groq API connection with simple request
    
    Returns connection status and basic model info.
    """
    try:
        from app.config import settings
        
        if not settings.groq_api_key:
            return {
                "status": "NOT_CONFIGURED",
                "message": "Groq API key not set. Service will use mock reasoning.",
                "model": settings.groq_model
            }
        
        reasoning_service = get_reasoning_service()
        
        # Create minimal test data
        test_data = EvaluationInput(
            symbol="NIFTY",
            setup_score=7.0,
            no_trade_score=3.0,
            decision="TRADE",
            threshold=6.5,
            no_trade_threshold=5.0,
            trend_score=7.5,
            trend_direction="BULLISH",
            vwap_score=7.0,
            vwap_status="Above VWAP",
            structure_score=7.0,
            oi_score=7.0,
            oi_pattern="Call buying",
            volatility_score=6.0,
            volatility_regime="MODERATE",
            momentum_score=7.0,
            internal_score=7.0,
            time_risk="PRIME_TIME",
            fake_breakout_risk="LOW"
        )
        
        # Test generation
        reasoning = await reasoning_service.generate_reasoning(test_data, use_lightweight=True)
        
        return {
            "status": "CONNECTED",
            "message": "Groq API connection successful",
            "model": reasoning.model,
            "generation_time_ms": reasoning.generation_time_ms,
            "test_result": {
                "confidence": reasoning.confidence_level,
                "strengths_count": len(reasoning.key_strengths),
                "risks_count": len(reasoning.key_risks)
            }
        }
        
    except Exception as e:
        logger.error(f"Connection test failed: {e}")
        return JSONResponse(
            status_code=500,
            content={
                "status": "ERROR",
                "message": str(e)
            }
        )


@router.get("/health")
async def reasoning_health():
    """Health check for reasoning service"""
    from app.config import settings
    
    return {
        "service": "ai-reasoning",
        "status": "UP",
        "groq_configured": bool(settings.groq_api_key),
        "model": settings.groq_model,
        "cache_ttl_minutes": settings.cache_ttl_minutes
    }
