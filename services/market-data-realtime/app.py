#!/usr/bin/env python3
"""
Real-time Market Data Fetcher
Continuously fetches FYERS data and serves it via REST API.
Also stores market snapshots to MongoDB for quant engine scoring.
"""
from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import os
from typing import Dict
from fyers_apiv3 import fyersModel
from dotenv import load_dotenv
import uvicorn
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

app = FastAPI(title="Market Data Real-time Service", version="2.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

APP_ID = os.getenv('FYERS_APP_ID')
ACCESS_TOKEN = os.getenv('FYERS_ACCESS_TOKEN')
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')
MONGODB_DATABASE = os.getenv('MONGODB_DATABASE', 'intraday_decision')

# Cache for latest prices
price_cache: Dict[str, dict] = {}
is_running = False

# MongoDB client (initialized on startup)
db_client = None
db = None

# Counter for snapshot storage (store every 60 seconds, not every second)
snapshot_counter = 0
SNAPSHOT_INTERVAL = 60  # Store a snapshot every 60 fetches (= 60 seconds)

def get_fyers_client():
    return fyersModel.FyersModel(
        client_id=APP_ID,
        token=ACCESS_TOKEN,
        is_async=False,
        log_path=""
    )

SYMBOL_MAP = {
    "NIFTY": "NSE:NIFTY50-INDEX",
    "BANKNIFTY": "NSE:NIFTYBANK-INDEX"
}

async def store_market_snapshot(symbol: str, price_data: dict):
    """Store a market snapshot in MongoDB for the quant engine to use"""
    global db
    if db is None:
        return
    
    try:
        snapshot = {
            'symbol': symbol,
            'timestamp': datetime.utcnow(),
            'ltp': price_data.get('ltp', 0),
            'change': price_data.get('change', 0),
            'changePercent': price_data.get('changePercent', 0),
            'volume': price_data.get('volume', 0),
            'source': 'FYERS_LIVE',
            'ohlc1m': {
                'open': price_data.get('open', price_data.get('ltp', 0)),
                'high': price_data.get('high', price_data.get('ltp', 0)),
                'low': price_data.get('low', price_data.get('ltp', 0)),
                'close': price_data.get('ltp', 0),
                'volume': price_data.get('volume', 0)
            }
        }
        
        await db.market_snapshots.insert_one(snapshot)
        print(f"📝 Stored snapshot for {symbol}: ₹{price_data.get('ltp', 0)}")
        
    except Exception as e:
        print(f"❌ Error storing snapshot for {symbol}: {e}")


async def fetch_live_prices():
    """Background task to continuously fetch FYERS data"""
    global is_running, price_cache, snapshot_counter
    is_running = True
    
    print("🚀 Starting real-time market data fetcher...")
    
    while is_running:
        try:
            fyers = get_fyers_client()
            
            # Fetch both symbols
            symbols = "NSE:NIFTY50-INDEX,NSE:NIFTYBANK-INDEX"
            response = fyers.quotes({"symbols": symbols})
            
            if response.get('s') == 'ok':
                for item in response.get('d', []):
                    v = item.get('v', {})
                    symbol_name = "NIFTY" if "NIFTY50" in item.get('n', '') else "BANKNIFTY"
                    
                    price_cache[symbol_name] = {
                        'symbol': symbol_name,
                        'ltp': v.get('lp', 0),
                        'open': v.get('open_price', 0),
                        'high': v.get('high_price', 0),
                        'low': v.get('low_price', 0),
                        'prevClose': v.get('prev_close_price', 0),
                        'change': v.get('ch', 0),
                        'changePercent': v.get('chp', 0),
                        'volume': v.get('volume', 0),
                        'timestamp': datetime.now().isoformat(),
                        'source': 'FYERS_LIVE'
                    }
                
                print(f"✅ Updated prices: NIFTY={price_cache.get('NIFTY', {}).get('ltp')}, BANKNIFTY={price_cache.get('BANKNIFTY', {}).get('ltp')}")
                
                # Store snapshots to MongoDB periodically
                snapshot_counter += 1
                if snapshot_counter >= SNAPSHOT_INTERVAL:
                    snapshot_counter = 0
                    for sym, data in price_cache.items():
                        await store_market_snapshot(sym, data)
            
        except Exception as e:
            print(f"❌ Error fetching prices: {e}")
        
        # Wait 1 second before next fetch (1 request per second)
        await asyncio.sleep(1)

@app.on_event("startup")
async def startup_event():
    """Start background task and connect to MongoDB on app startup"""
    global db_client, db
    
    # Connect to MongoDB
    try:
        db_client = AsyncIOMotorClient(MONGODB_URI)
        db = db_client[MONGODB_DATABASE]
        # Create index for efficient querying
        await db.market_snapshots.create_index([
            ("symbol", 1), 
            ("timestamp", -1)
        ])
        print(f"✅ Connected to MongoDB at {MONGODB_URI}")
    except Exception as e:
        print(f"⚠️ MongoDB connection failed: {e} - continuing without snapshot storage")
        db = None
    
    asyncio.create_task(fetch_live_prices())

@app.on_event("shutdown")
async def shutdown_event():
    """Stop background task and close MongoDB on shutdown"""
    global is_running, db_client
    is_running = False
    if db_client:
        db_client.close()

@app.get("/")
def root():
    return {
        "service": "Market Data Real-time Service",
        "status": "running",
        "cached_symbols": list(price_cache.keys()),
        "mongodb_connected": db is not None,
        "endpoints": {
            "live": "/live/{symbol}",
            "quotes": "/quotes/{symbols}",
            "all": "/all"
        }
    }

@app.get("/live/{symbol}")
def get_live_price(symbol: str):
    """Get cached live price for a symbol"""
    symbol = symbol.upper()
    if symbol in price_cache:
        return {
            'status': 'success',
            'data': price_cache[symbol]
        }
    return {
        'status': 'error',
        'message': f'Symbol {symbol} not found in cache'
    }

@app.get("/all")
def get_all_prices():
    """Get all cached prices"""
    return {
        'status': 'success',
        'data': list(price_cache.values()),
        'count': len(price_cache)
    }

if __name__ == "__main__":
    print("🚀 Starting Market Data Real-time Service on port 8006")
    print("📊 Fetching live FYERS data every 1 second")
    print("📝 Storing market snapshots to MongoDB every 60 seconds")
    uvicorn.run(app, host="0.0.0.0", port=8006)
