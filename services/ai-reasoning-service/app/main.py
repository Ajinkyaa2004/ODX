from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events"""
    logger.info("========================================")
    logger.info("AI Reasoning Service Starting...")
    logger.info("Port: 8002")
    logger.info("========================================")
    yield
    logger.info("AI Reasoning Service Shutting Down...")

app = FastAPI(
    title="AI Reasoning Service",
    description="AI-powered trade explanation and reasoning service",
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
        "service": "ai-reasoning-service",
        "status": "UP",
        "port": 8002
    }

@app.get("/api/ai/health")
async def api_health():
    """API health check endpoint"""
    return await health()

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "AI Reasoning Service",
        "status": "running",
        "docs": "/docs",
        "health": "/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8002,
        reload=True,
        log_level="info"
    )
