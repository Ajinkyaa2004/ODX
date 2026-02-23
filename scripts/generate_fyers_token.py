#!/usr/bin/env python3
"""
FYERS Access Token Generator
This script helps you generate a new FYERS access token using OAuth2 flow.
"""

import os
import webbrowser
from urllib.parse import urlparse, parse_qs
from datetime import datetime, timedelta
import jwt

def decode_token(token):
    """Decode JWT token to check expiry"""
    try:
        decoded = jwt.decode(token, options={"verify_signature": False})
        exp_timestamp = decoded.get('exp', 0)
        exp_date = datetime.fromtimestamp(exp_timestamp)
        return exp_date
    except Exception as e:
        return None

def generate_auth_url(app_id, redirect_uri):
    """Generate FYERS authorization URL"""
    base_url = "https://api-t1.fyers.in/api/v3/generate-authcode"
    params = {
        "client_id": app_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "state": "sample_state"
    }
    
    query_string = "&".join([f"{k}={v}" for k, v in params.items()])
    return f"{base_url}?{query_string}"

def get_access_token(app_id, secret_key, auth_code):
    """Exchange authorization code for access token"""
    import requests
    
    url = "https://api-t1.fyers.in/api/v3/validate-authcode"
    
    payload = {
        "grant_type": "authorization_code",
        "appIdHash": generate_app_hash(app_id, secret_key),
        "code": auth_code
    }
    
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        data = response.json()
        
        if data.get('s') == 'ok':
            return data.get('access_token')
        else:
            print(f"Error: {data.get('message', 'Unknown error')}")
            return None
    except Exception as e:
        print(f"Error getting access token: {e}")
        return None

def generate_app_hash(app_id, secret_key):
    """Generate app hash for FYERS API"""
    import hashlib
    
    app_id_without_hyphen = app_id.split('-')[0]
    message = f"{app_id_without_hyphen}:{secret_key}"
    return hashlib.sha256(message.encode()).hexdigest()

def update_env_file(access_token):
    """Update .env file with new access token"""
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
    
    if not os.path.exists(env_path):
        print(f"Error: .env file not found at {env_path}")
        return False
    
    # Read current .env file
    with open(env_path, 'r') as f:
        lines = f.readlines()
    
    # Update FYERS_ACCESS_TOKEN line
    updated = False
    for i, line in enumerate(lines):
        if line.startswith('FYERS_ACCESS_TOKEN='):
            lines[i] = f'FYERS_ACCESS_TOKEN={access_token}\n'
            updated = True
            break
    
    if not updated:
        lines.append(f'\nFYERS_ACCESS_TOKEN={access_token}\n')
    
    # Write back to .env file
    with open(env_path, 'w') as f:
        f.writelines(lines)
    
    print(f"✅ Updated .env file with new access token")
    return True

def main():
    print("=" * 60)
    print("FYERS Access Token Generator")
    print("=" * 60)
    
    # Load credentials from .env
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
    
    if os.path.exists(env_path):
        from dotenv import load_dotenv
        load_dotenv(env_path)
    
    app_id = os.getenv('FYERS_APP_ID', '')
    secret_key = os.getenv('FYERS_SECRET_KEY', '')
    current_token = os.getenv('FYERS_ACCESS_TOKEN', '')
    redirect_uri = os.getenv('FYERS_REDIRECT_URI', 'http://localhost:3000/api/auth/fyers/callback')
    
    # Check current token expiry
    if current_token:
        exp_date = decode_token(current_token)
        if exp_date:
            now = datetime.now()
            if exp_date > now:
                print(f"\n✅ Current token is still valid until: {exp_date}")
                print(f"   Time remaining: {exp_date - now}")
                response = input("\nDo you want to generate a new token anyway? (y/N): ")
                if response.lower() != 'y':
                    print("Exiting...")
                    return
            else:
                print(f"\n❌ Current token expired on: {exp_date}")
                print("   Generating new token...")
    
    # Check if credentials are present
    if not app_id or not secret_key:
        print("\n❌ Error: FYERS_APP_ID or FYERS_SECRET_KEY not found in .env file")
        print("\nPlease add your FYERS credentials to .env file:")
        print("  FYERS_APP_ID=your_app_id")
        print("  FYERS_SECRET_KEY=your_secret_key")
        print("\nGet your credentials from: https://myapi.fyers.in/")
        return
    
    print(f"\n📋 Using credentials:")
    print(f"   App ID: {app_id}")
    print(f"   Redirect URI: {redirect_uri}")
    
    # Step 1: Generate authorization URL
    auth_url = generate_auth_url(app_id, redirect_uri)
    
    print("\n" + "=" * 60)
    print("Step 1: Authorize the application")
    print("=" * 60)
    print(f"\nOpening browser to authorize FYERS access...")
    print(f"\nIf browser doesn't open, visit this URL:")
    print(f"{auth_url}\n")
    
    # Try to open browser
    try:
        webbrowser.open(auth_url)
    except:
        pass
    
    # Step 2: Get authorization code from user
    print("\n" + "=" * 60)
    print("Step 2: Get authorization code")
    print("=" * 60)
    print("\nAfter authorization, you'll be redirected to a URL like:")
    print("http://localhost:3000/api/auth/fyers/callback?code=XXXXX&state=sample_state")
    print("\nCopy the entire redirected URL or just the 'code' parameter")
    
    redirect_url = input("\nPaste the redirected URL or authorization code: ").strip()
    
    # Extract auth code from URL if full URL was provided
    auth_code = redirect_url
    if 'code=' in redirect_url:
        parsed = urlparse(redirect_url)
        params = parse_qs(parsed.query)
        auth_code = params.get('code', [''])[0]
    
    if not auth_code:
        print("\n❌ Error: No authorization code found")
        return
    
    print(f"\n✓ Authorization code: {auth_code[:20]}...")
    
    # Step 3: Exchange for access token
    print("\n" + "=" * 60)
    print("Step 3: Getting access token")
    print("=" * 60)
    
    # Install requests if not available
    try:
        import requests
    except ImportError:
        print("\nInstalling required package: requests")
        os.system("pip install requests")
        import requests
    
    access_token = get_access_token(app_id, secret_key, auth_code)
    
    if access_token:
        print(f"\n✅ Successfully generated access token!")
        
        # Decode and show expiry
        exp_date = decode_token(access_token)
        if exp_date:
            print(f"   Token expires on: {exp_date}")
            print(f"   Valid for: {exp_date - datetime.now()}")
        
        # Update .env file
        print("\n" + "=" * 60)
        print("Step 4: Updating .env file")
        print("=" * 60)
        
        if update_env_file(access_token):
            print("\n✅ All done! Your FYERS access token has been updated.")
            print("\nNext steps:")
            print("  1. Restart your Docker containers:")
            print("     docker compose down")
            print("     docker compose up -d")
            print("  2. Your application is now ready to connect to FYERS API")
        else:
            print(f"\n❌ Failed to update .env file")
            print(f"\nPlease manually add this to your .env file:")
            print(f"FYERS_ACCESS_TOKEN={access_token}")
    else:
        print("\n❌ Failed to generate access token")
        print("\nPlease check:")
        print("  1. Your FYERS_APP_ID and FYERS_SECRET_KEY are correct")
        print("  2. You've authorized the application correctly")
        print("  3. The authorization code hasn't expired (use it within 5 minutes)")

if __name__ == "__main__":
    # Check for required packages
    try:
        import jwt
        from dotenv import load_dotenv
    except ImportError:
        print("Installing required packages...")
        os.system("pip install PyJWT python-dotenv requests")
        print("\nPlease run the script again.")
        exit(1)
    
    main()
