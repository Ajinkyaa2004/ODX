from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
from typing import Dict, List
from fyers_apiv3 import fyersModel
from dotenv import load_dotenv
import uvicorn

load_dotenv()

app = FastAPI(title="FYERS Data Bridge", version="1.0")

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

def get_fyers_client():
    """Initialize FYERS client"""
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

@app.get("/")
def root():
    return {
        "service": "FYERS Data Bridge",
        "status": "running",
        "endpoints": {
            "quotes": "/quotes/{symbols}",
            "live": "/live/{symbol}",
            "health": "/health"
        }
    }

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.get("/quotes/{symbols}")
def get_quotes(symbols: str):
    """
    Get real-time quotes for multiple symbols
    Example: /quotes/NIFTY,BANKNIFTY
    """
    try:
        fyers = get_fyers_client()
        
        # Convert symbols
        symbol_list = symbols.split(',')
        fyers_symbols = []
        for symbol in symbol_list:
            fyers_symbol = SYMBOL_MAP.get(symbol.strip().upper(), f"NSE:{symbol}")
            fyers_symbols.append(fyers_symbol)
        
        data = {"symbols": ",".join(fyers_symbols)}
        response = fyers.quotes(data)
        
        if response.get('s') == 'ok':
            # Transform to simplified format
            quotes = []
            for item in response.get('d', []):
                v = item.get('v', {})
                quotes.append({
                    'symbol': item.get('n', ''),
                    'ltp': v.get('lp', 0),
                    'open': v.get('open_price', 0),
                    'high': v.get('high_price', 0),
                    'low': v.get('low_price', 0),
                    'prevClose': v.get('prev_close_price', 0),
                    'change': v.get('ch', 0),
                    'changePercent': v.get('chp', 0),
                    'volume': v.get('volume', 0),
                    'timestamp': v.get('tt', '')
                })
            
            return {
                'status': 'success',
                'data': quotes
            }
        else:
            raise HTTPException(status_code=500, detail=response.get('message', 'Unknown error'))
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/live/{symbol}")
def get_live_price(symbol: str):
    """
    Get live price for a single symbol
    Example: /live/NIFTY
    """
    try:
        fyers = get_fyers_client()
        
        fyers_symbol = SYMBOL_MAP.get(symbol.upper(), f"NSE:{symbol}")
        
        data = {"symbols": fyers_symbol}
        response = fyers.quotes(data)
        
        if response.get('s') == 'ok' and response.get('d'):
            item = response['d'][0]
            v = item.get('v', {})
            
            return {
                'status': 'success',
                'data': {
                    'symbol': symbol.upper(),
                    'ltp': v.get('lp', 0),
                    'open': v.get('open_price', 0),
                    'high': v.get('high_price', 0),
                    'low': v.get('low_price', 0),
                    'prevClose': v.get('prev_close_price', 0),
                    'change': v.get('ch', 0),
                    'changePercent': v.get('chp', 0),
                    'volume': v.get('volume', 0),
                    'timestamp': v.get('tt', '')
                }
            }
        else:
            raise HTTPException(status_code=500, detail=response.get('message', 'Unknown error'))
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    print("🚀 Starting FYERS Data Bridge on port 8005")
    print("📊 Real-time FYERS data available at http://localhost:8005")
    uvicorn.run(app, host="0.0.0.0", port=8005)
