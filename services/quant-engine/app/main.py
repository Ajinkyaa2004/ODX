from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from datetime import datetime
import logging

from app.service import indicator_service
from app.models import (
    ScoreRequest, ScoreResponse, ScoreHistoryResponse, ScoreComponents,
    NoTradeScoreResponse, NoTradeComponents, VolumeProfileData, FakeBreakoutData,
    EnhancedEvaluationResponse, RiskModeRequest, TradeDecisionResponse
)
from app.no_trade_scoring import NoTradeScorer
from app.volume_profile import VolumeProfileCalculator, FakeBreakoutDetector
from app.trading_gate import get_trading_gate, set_global_risk_mode
from app.no_trade_scoring import NoTradeScorer
from app.volume_profile import VolumeProfileCalculator, FakeBreakoutDetector
from app.trading_gate import get_trading_gate, set_global_risk_mode, RiskMode

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Scheduler for automatic scoring
scheduler = AsyncIOScheduler()

async def scheduled_score_calculation():
    """
    Scheduled task to calculate scores for NIFTY and BANKNIFTY every 3 minutes
    """
    logger.info("Running scheduled score calculation...")
    
    symbols = ["NIFTY", "BANKNIFTY"]
    timeframes = ["5m", "15m"]
    
    for symbol in symbols:
        for timeframe in timeframes:
            try:
                result = await indicator_service.calculate_score_for_symbol(
                    symbol=symbol,
                    timeframe=timeframe
                )
                if result:
                    logger.info(
                        f"✓ {symbol} ({timeframe}): Score={result['setup_score']:.2f}, "
                        f"Bias={result['market_bias']}"
                    )
                else:
                    logger.warning(f"✗ Failed to calculate score for {symbol} ({timeframe})")
            except Exception as e:
                logger.error(f"Error in scheduled scoring for {symbol} ({timeframe}): {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events"""
    logger.info("========================================")
    logger.info("Quant Engine Starting...")
    logger.info("Port: 8001")
    logger.info("========================================")
    
    # Start scheduler for automatic score calculation (every 3 minutes)
    scheduler.add_job(
        scheduled_score_calculation,
        'interval',
        minutes=3,
        id='score_calculation',
        name='Calculate Setup Scores',
        replace_existing=True
    )
    scheduler.start()
    logger.info("✓ Scheduler started - calculating scores every 3 minutes")
    
    yield
    
    # Shutdown scheduler
    scheduler.shutdown()
    logger.info("Quant Engine Shutting Down...")

app = FastAPI(
    title="Quant Engine",
    description="Quantitative scoring and analysis engine",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "service": "quant-engine",
        "status": "UP",
        "port": 8001
    }

@app.get("/api/quant/health")
async def api_health():
    """API health check endpoint"""
    return await health()

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Quant Engine",
        "status": "running",
        "docs": "/docs",
        "health": "/health"
    }


# ============================================================================
# Phase 2: Scoring API Endpoints
# ============================================================================

@app.post("/api/quant/evaluate", response_model=ScoreResponse)
async def evaluate_setup(request: ScoreRequest):
    """
    Calculate setup score for a symbol
    
    Evaluates trend, VWAP, structure, momentum, internals, and OI confirmation
    to produce an aggregate setup score (0-10) with market bias determination.
    """
    try:
        result = await indicator_service.calculate_score_for_symbol(
            symbol=request.symbol,
            timeframe=request.timeframe
        )
        
        if not result:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to calculate score for {request.symbol}"
            )
        
        # Convert to response model
        return ScoreResponse(
            symbol=result['symbol'],
            timeframe=result['timeframe'],
            timestamp=result['timestamp'],
            setup_score=result['setup_score'],
            components=ScoreComponents(**result['components']),
            market_bias=result['market_bias'],
            evaluation_time_seconds=result['evaluation_time_seconds']
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in evaluate_setup: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/quant/score/{symbol}", response_model=ScoreResponse)
async def get_latest_score(symbol: str, timeframe: str = "5m"):
    """
    Get the latest calculated score for a symbol
    
    Returns the most recent score from the database. If no score exists,
    triggers a new calculation.
    """
    try:
        # First try to get latest from database
        history = await indicator_service.get_score_history(
            symbol=symbol,
            timeframe=timeframe,
            limit=1
        )
        
        if history and len(history) > 0:
            latest = history[0]
            return ScoreResponse(
                symbol=latest['symbol'],
                timeframe=latest['timeframe'],
                timestamp=latest['timestamp'],
                setup_score=latest['setup_score'],
                components=ScoreComponents(**latest['components']),
                market_bias=latest['market_bias'],
                evaluation_time_seconds=latest['evaluation_time_seconds']
            )
        
        # No score exists, calculate new one
        logger.info(f"No existing score for {symbol} ({timeframe}), calculating...")
        result = await indicator_service.calculate_score_for_symbol(
            symbol=symbol,
            timeframe=timeframe
        )
        
        if not result:
            raise HTTPException(
                status_code=404,
                detail=f"No score data available for {symbol}"
            )
        
        return ScoreResponse(
            symbol=result['symbol'],
            timeframe=result['timeframe'],
            timestamp=result['timestamp'],
            setup_score=result['setup_score'],
            components=ScoreComponents(**result['components']),
            market_bias=result['market_bias'],
            evaluation_time_seconds=result['evaluation_time_seconds']
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get_latest_score: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/quant/score/{symbol}/history", response_model=ScoreHistoryResponse)
async def get_score_history(symbol: str, timeframe: str = "5m", limit: int = 20):
    """
    Get historical scores for a symbol
    
    Returns up to `limit` most recent scores for analysis and charting.
    """
    try:
        scores = await indicator_service.get_score_history(
            symbol=symbol,
            timeframe=timeframe,
            limit=min(limit, 100)  # Cap at 100
        )
        
        score_responses = []
        for score in scores:
            score_responses.append(
                ScoreResponse(
                    symbol=score['symbol'],
                    timeframe=score['timeframe'],
                    timestamp=score['timestamp'],
                    setup_score=score['setup_score'],
                    components=ScoreComponents(**score['components']),
                    market_bias=score['market_bias'],
                    evaluation_time_seconds=score['evaluation_time_seconds']
                )
            )
        
        return ScoreHistoryResponse(
            symbol=symbol,
            timeframe=timeframe,
            scores=score_responses,
            count=len(score_responses)
        )
        
    except Exception as e:
        logger.error(f"Error in get_score_history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Phase 4: Advanced Filters and No-Trade Scoring Endpoints
# ============================================================================

@app.get("/api/quant/no-trade-score/{symbol}", response_model=NoTradeScoreResponse)
async def get_no_trade_score(symbol: str, timeframe: str = "5m"):
    """
    Calculate the no-trade score for a symbol
    
    Returns a score (0-10) indicating whether to avoid trading.
    Higher score = more reasons to NOT trade.
    """
    try:
        # Get latest OHLC data
        df_ohlc = await indicator_service.fetch_ohlc_data(symbol, timeframe)
        if df_ohlc is None or len(df_ohlc) < 50:
            raise HTTPException(
                status_code=404,
                detail=f"Insufficient OHLC data for {symbol}"
            )
        
        # Calculate indicators needed for no-trade scoring
        indicators = await indicator_service.calculate_indicators(df_ohlc)
        
        # Initialize no-trade scorer
        no_trade_scorer = NoTradeScorer()
        
        # Calculate no-trade score
        no_trade_result = no_trade_scorer.calculate_no_trade_score(
            df_ohlc, 
            indicators
        )
        
        # Determine recommendation
        recommendation = "NO-TRADE" if no_trade_result['no_trade_score'] >= 6.0 else "TRADE"
        
        # Extract blocking reasons
        blocking_reasons = []
        components = no_trade_result['components']
        
        if components['time_risk']['score'] >= 7:
            blocking_reasons.append(f"High time risk: {components['time_risk']['reason']}")
        if components['chop_detection']['score'] >= 6:
            blocking_reasons.append(f"Choppy market: {components['chop_detection']['reason']}")
        if components['resistance_proximity']['score'] >= 7:
            blocking_reasons.append(f"Near S/R: {components['resistance_proximity']['reason']}")
        if components['volatility_compression']['score'] >= 7:
            blocking_reasons.append(f"Volatility issue: {components['volatility_compression']['reason']}")
        if components['consecutive_loss']['score'] >= 8:
            blocking_reasons.append(f"Loss guard: {components['consecutive_loss']['reason']}")
        
        return NoTradeScoreResponse(
            symbol=symbol,
            timeframe=timeframe,
            timestamp=datetime.now(),
            no_trade_score=no_trade_result['no_trade_score'],
            components=NoTradeComponents(**components),
            recommendation=recommendation,
            blocking_reasons=blocking_reasons
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get_no_trade_score: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/quant/evaluation/{symbol}", response_model=EnhancedEvaluationResponse)
async def get_enhanced_evaluation(symbol: str, timeframe: str = "5m"):
    """
    Get comprehensive evaluation including setup score, no-trade score, 
    volume profile, and fake breakout detection
    """
    try:
        # Get latest OHLC data
        df_ohlc = await indicator_service.fetch_ohlc_data(symbol, timeframe)
        if df_ohlc is None or len(df_ohlc) < 50:
            raise HTTPException(
                status_code=404,
                detail=f"Insufficient OHLC data for {symbol}"
            )
        
        # Get latest setup score
        score_result = await indicator_service.calculate_score_for_symbol(
            symbol=symbol,
            timeframe=timeframe
        )
        
        if not score_result:
            raise HTTPException(
                status_code=404,
                detail=f"No score data available for {symbol}"
            )
        
        # Calculate indicators
        indicators = await indicator_service.calculate_indicators(df_ohlc)
        
        # Calculate no-trade score
        no_trade_scorer = NoTradeScorer()
        no_trade_result = no_trade_scorer.calculate_no_trade_score(df_ohlc, indicators)
        
        # Calculate volume profile
        volume_calculator = VolumeProfileCalculator()
        volume_profile = volume_calculator.calculate(df_ohlc)
        
        # Detect fake breakouts
        fake_breakout_detector = FakeBreakoutDetector()
        fake_breakout = fake_breakout_detector.detect(df_ohlc, volume_profile)
        
        # Determine trade recommendation
        setup_score = score_result['setup_score']
        no_trade_score = no_trade_result['no_trade_score']
        
        if setup_score >= 7 and no_trade_score <= 4 and not fake_breakout['is_fake_breakout']:
            recommendation = "TRADE"
        else:
            recommendation = "NO-TRADE"
        
        return EnhancedEvaluationResponse(
            symbol=symbol,
            timeframe=timeframe,
            timestamp=datetime.now(),
            setup_score=setup_score,
            no_trade_score=no_trade_score,
            volume_profile=VolumeProfileData(**volume_profile),
            fake_breakout=FakeBreakoutData(**fake_breakout),
            trade_recommendation=recommendation
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get_enhanced_evaluation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/quant/set-risk-mode")
async def set_risk_mode(request: RiskModeRequest):
    """
    Set the global risk mode for trade gating
    
    Modes:
    - CONSERVATIVE: Higher setup threshold (8), lower no-trade tolerance (4)
    - BALANCED: Medium thresholds (7, 6)
    - AGGRESSIVE: Lower setup threshold (6), higher no-trade tolerance (7)
    """
    try:
        # Validate mode before setting
        if request.mode not in ["CONSERVATIVE", "BALANCED", "AGGRESSIVE"]:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid risk mode: {request.mode}. Must be CONSERVATIVE, BALANCED, or AGGRESSIVE"
            )
        
        # Set global risk mode
        success = set_global_risk_mode(request.mode)
        
        if not success:
            raise HTTPException(
                status_code=400,
                detail=f"Failed to set risk mode to {request.mode}"
            )
        
        # Get trading gate to confirm
        gate = get_trading_gate()
        
        # Get thresholds from TradeGateConfig for current risk mode
        from app.trading_gate import TradeGateConfig, RiskMode as GateRiskMode
        
        mode_enum = GateRiskMode[request.mode]
        min_setup = TradeGateConfig.SETUP_THRESHOLDS[mode_enum]
        max_no_trade = TradeGateConfig.NO_TRADE_THRESHOLDS[mode_enum]
        allow_opening = not TradeGateConfig.BLOCK_OPENING_NOISE[mode_enum]
        allow_chop = not TradeGateConfig.BLOCK_CHOP_HOUR[mode_enum]
        
        return {
            "success": True,
            "message": f"Risk mode set to {request.mode}",
            "config": {
                "mode": request.mode,
                "min_setup_score": min_setup,
                "max_no_trade_score": max_no_trade,
                "allow_opening_range": allow_opening,
                "allow_chop_hour": allow_chop
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in set_risk_mode: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/quant/trade-decision/{symbol}", response_model=TradeDecisionResponse)
async def get_trade_decision(symbol: str, timeframe: str = "5m"):
    """
    Get the final trade gating decision for a symbol
    
    Applies all Phase 4 filters including setup score, no-trade score,
    volatility regime, time filters, fake breakout detection, and OI divergence.
    """
    try:
        # Get latest OHLC data
        df_ohlc = await indicator_service.fetch_ohlc_data(symbol, timeframe)
        if df_ohlc is None or len(df_ohlc) < 50:
            raise HTTPException(
                status_code=404,
                detail=f"Insufficient OHLC data for {symbol}"
            )
        
        # Get latest setup score
        score_result = await indicator_service.calculate_score_for_symbol(
            symbol=symbol,
            timeframe=timeframe
        )
        
        if not score_result:
            raise HTTPException(
                status_code=404,
                detail=f"No score data available for {symbol}"
            )
        
        setup_score = score_result['setup_score']
        
        # Calculate indicators
        indicators = await indicator_service.calculate_indicators(df_ohlc)
        
        # Calculate no-trade score
        no_trade_scorer = NoTradeScorer()
        no_trade_result = no_trade_scorer.calculate_no_trade_score(df_ohlc, indicators)
        no_trade_score = no_trade_result['no_trade_score']
        
        # Calculate volume profile
        volume_calculator = VolumeProfileCalculator()
        volume_profile = volume_calculator.calculate(df_ohlc)
        
        # Detect fake breakouts
        fake_breakout_detector = FakeBreakoutDetector()
        fake_breakout = fake_breakout_detector.detect(df_ohlc, volume_profile)
        
        # Get trading gate
        gate = get_trading_gate()
        
        # Evaluate trade decision
        decision_result = gate.evaluate_trade_decision(
            setup_score=setup_score,
            no_trade_score=no_trade_score,
            volatility_regime=None,  # Extract from indicators if needed
            time_category=None,  # Extract from no_trade_result if needed
            fake_breakout_risk=fake_breakout['is_fake_breakout'],
            oi_analysis=None  # Could fetch OI analysis if needed
        )
        
        return TradeDecisionResponse(
            symbol=symbol,
            timestamp=datetime.now(),
            trade_allowed=decision_result['trade_allowed'],
            decision=decision_result['decision'],
            confidence=decision_result['confidence'],
            setup_score=setup_score,
            no_trade_score=no_trade_score,
            current_risk_mode=decision_result['risk_mode'],
            blocking_reasons=decision_result['blocking_reasons'],
            warnings=decision_result['warnings']
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get_trade_decision: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    )
