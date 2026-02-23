#!/usr/bin/env python3
"""
Quick test script to fetch FYERS data using REST API
Run: python test_fyers_rest.py
"""
import requests
import os
from dotenv import load_dotenv

load_dotenv()

APP_ID = os.getenv('FYERS_APP_ID')
ACCESS_TOKEN = os.getenv('FYERS_ACCESS_TOKEN')
AUTH_TOKEN = f"{APP_ID}:{ACCESS_TOKEN}"

def test_quotes():
    """Test FYERS quotes API"""
    # Try different endpoint versions
    urls = [
        "https://api.fyers.in/data-rest/v2/quotes",
        "https://api-t1.fyers.in/data-rest/v2/quotes",
        "https://api.fyers.in/data-rest/v3/quotes"
    ]
    
    headers = {
        "Authorization": AUTH_TOKEN
    }
    
    params = {
        "symbols": "NSE:NIFTY50-INDEX,NSE:NIFTYBANK-INDEX"
    }
    
    for url in urls:
        try:
            print(f"\nTesting: {url}")
            response = requests.get(url, headers=headers, params=params, timeout=10)
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ SUCCESS! Data: {data}")
                return
            else:
                print(f"Response: {response.text[:200]}")
                
        except Exception as e:
            print(f"Error: {e}")
    
    print("\n❌ All endpoints failed")

def test_websocket_url():
    """Test WebSocket connection"""
    import websocket
    
    ws_urls = [
        f"wss://api.fyers.in/socket/v2/datahub?access_token={AUTH_TOKEN}",
        f"wss://api-t1.fyers.in/socket/v2/datahub?access_token={AUTH_TOKEN}",
    ]
    
    for ws_url in ws_urls:
        print(f"\nTesting WebSocket: {ws_url[:60]}...")
        try:
            ws = websocket.create_connection(ws_url, timeout=5)
            print("✅ WebSocket connected!")
            ws.close()
            return
        except Exception as e:
            print(f"❌ Failed: {str(e)[:100]}")
    
    print("\n❌ All WebSocket URLs failed")

if __name__ == "__main__":
    test_quotes()
    print("\n" + "="*60 + "\n")
    test_websocket_url()
