from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from datetime import datetime
import logging

from app.service import indicator_service
from app.models import ScoreRequest, ScoreResponse, ScoreHistoryResponse, ScoreComponents

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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    )
