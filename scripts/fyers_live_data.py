#!/usr/bin/env python3
"""
FYERS Real-time Data Fetcher using official SDK
This script fetches REAL market data from FYERS and can be called by Java services
"""
import os
import sys
import json
from fyers_apiv3 import fyersModel
from dotenv import load_dotenv

load_dotenv()

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

def get_quotes(symbols):
    """Get real-time quotes for symbols"""
    try:
        fyers = get_fyers_client()
        
        # Convert symbols to FYERS format
        fyers_symbols = []
        for symbol in symbols:
            if symbol == "NIFTY":
                fyers_symbols.append("NSE:NIFTY50-INDEX")
            elif symbol == "BANKNIFTY":
                fyers_symbols.append("NSE:NIFTYBANK-INDEX")
            else:
                fyers_symbols.append(f"NSE:{symbol}")
        
        # Fetch quotes
        data = {
            "symbols": ",".join(fyers_symbols)
        }
        
        response = fyers.quotes(data)
        
        if response.get('s') == 'ok':
            return {
                'status': 'success',
                'data': response.get('d', [])
            }
        else:
            return {
                'status': 'error',
                'message': response.get('message', 'Unknown error'),
                'code': response.get('code')
            }
            
    except Exception as e:
        return {
            'status': 'error',
            'message': str(e)
        }

def get_market_depth(symbol):
    """Get market depth for a symbol"""
    try:
        fyers = get_fyers_client()
        
        # Convert to FYERS format
        if symbol == "NIFTY":
            fyers_symbol = "NSE:NIFTY50-INDEX"
        elif symbol == "BANKNIFTY":
            fyers_symbol = "NSE:NIFTYBANK-INDEX"
        else:
            fyers_symbol = f"NSE:{symbol}"
        
        data = {
            "symbol": fyers_symbol,
            "ohlcv_flag": "1"
        }
        
        response = fyers.depth(data)
        
        if response.get('s') == 'ok':
            return {
                'status': 'success',
                'data': response.get('d', {})
            }
        else:
            return {
                'status': 'error',
                'message': response.get('message', 'Unknown error')
            }
            
    except Exception as e:
        return {
            'status': 'error',
            'message': str(e)
        }

def get_historical_data(symbol, resolution='1', from_date=None, to_date=None):
    """Get historical OHLC data"""
    try:
        fyers = get_fyers_client()
        
        # Convert to FYERS format
        if symbol == "NIFTY":
            fyers_symbol = "NSE:NIFTY50-INDEX"
        elif symbol == "BANKNIFTY":
            fyers_symbol = "NSE:NIFTYBANK-INDEX"
        else:
            fyers_symbol = f"NSE:{symbol}"
        
        import time
        from datetime import datetime, timedelta
        
        if not to_date:
            to_date = int(time.time())
        if not from_date:
            from_date = to_date - (24 * 60 * 60)  # 24 hours ago
        
        data = {
            "symbol": fyers_symbol,
            "resolution": resolution,
            "date_format": "1",
            "range_from": str(from_date),
            "range_to": str(to_date),
            "cont_flag": "1"
        }
        
        response = fyers.history(data)
        
        if response.get('s') == 'ok':
            return {
                'status': 'success',
                'data': response.get('candles', [])
            }
        else:
            return {
                'status': 'error',
                'message': response.get('message', 'Unknown error')
            }
            
    except Exception as e:
        return {
            'status': 'error',
            'message': str(e)
        }

if __name__ == "__main__":
    # Test quotes
    print("Fetching REAL data from FYERS API...")
    print("=" * 60)
    
    result = get_quotes(["NIFTY", "BANKNIFTY"])
    print("\n📊 QUOTES:")
    print(json.dumps(result, indent=2))
    
    if result['status'] == 'success':
        print("\n✅ SUCCESS! Real FYERS data retrieved!")
        for item in result['data']:
            symbol = item.get('n', 'N/A')
            ltp = item.get('v', {}).get('lp', 0)
            change = item.get('v', {}).get('ch', 0)
            change_pct = item.get('v', {}).get('chp', 0)
            print(f"\n{symbol}:")
            print(f"  LTP: {ltp}")
            print(f"  Change: {change} ({change_pct}%)")
    else:
        print(f"\n❌ ERROR: {result.get('message')}")
        print("Note: Market might be closed or API might be down")
