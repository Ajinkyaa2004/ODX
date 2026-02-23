#!/usr/bin/env python3
"""
Simple FYERS Authentication Script using Official SDK
This is the recommended method using fyers-apiv3 package
"""

import os
import sys
from datetime import datetime

def load_env():
    """Load environment variables from .env file"""
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
    
    if not os.path.exists(env_path):
        print(f"❌ Error: .env file not found at {env_path}")
        sys.exit(1)
    
    from dotenv import load_dotenv
    load_dotenv(env_path)
    
    return {
        'app_id': os.getenv('FYERS_APP_ID', ''),
        'secret_key': os.getenv('FYERS_SECRET_KEY', ''),
        'redirect_uri': os.getenv('FYERS_REDIRECT_URI', 'http://localhost:3000/api/auth/fyers/callback')
    }

def update_env_token(access_token):
    """Update access token in .env file"""
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
    
    with open(env_path, 'r') as f:
        lines = f.readlines()
    
    updated = False
    for i, line in enumerate(lines):
        if line.startswith('FYERS_ACCESS_TOKEN='):
            lines[i] = f'FYERS_ACCESS_TOKEN={access_token}\n'
            updated = True
            break
    
    if not updated:
        lines.append(f'FYERS_ACCESS_TOKEN={access_token}\n')
    
    with open(env_path, 'w') as f:
        f.writelines(lines)
    
    print(f"✅ Updated .env file successfully")

def main():
    print("=" * 70)
    print(" FYERS Authentication - Simple Method (Official SDK)")
    print("=" * 70)
    
    # Install fyers-apiv3 if not present
    try:
        from fyers_apiv3 import fyersModel
    except ImportError:
        print("\n📦 Installing fyers-apiv3 package...")
        os.system(f"{sys.executable} -m pip install fyers-apiv3 python-dotenv PyJWT")
        try:
            from fyers_apiv3 import fyersModel
        except ImportError:
            print("❌ Failed to install fyers-apiv3. Please install manually:")
            print("   pip install fyers-apiv3")
            sys.exit(1)
    
    # Load credentials
    creds = load_env()
    
    if not creds['app_id'] or not creds['secret_key']:
        print("\n❌ Error: FYERS credentials not found in .env file")
        print("\nPlease add to .env:")
        print("   FYERS_APP_ID=your_app_id")
        print("   FYERS_SECRET_KEY=your_secret_key")
        print("\nGet credentials from: https://myapi.fyers.in/")
        sys.exit(1)
    
    print(f"\n📋 Configuration:")
    print(f"   App ID: {creds['app_id']}")
    print(f"   Redirect URI: {creds['redirect_uri']}")
    
    # Create session
    session = fyersModel.SessionModel(
        client_id=creds['app_id'],
        secret_key=creds['secret_key'],
        redirect_uri=creds['redirect_uri'],
        response_type="code",
        grant_type="authorization_code"
    )
    
    # Generate auth URL
    auth_url = session.generate_authcode()
    
    print("\n" + "=" * 70)
    print(" STEP 1: Authorize Application")
    print("=" * 70)
    print(f"\n🌐 Opening authorization URL in browser...")
    print(f"\nIf browser doesn't open, visit this URL:")
    print(f"\n{auth_url}\n")
    
    # Try to open browser
    import webbrowser
    try:
        webbrowser.open(auth_url)
    except:
        pass
    
    print("\n" + "=" * 70)
    print(" STEP 2: Get Authorization Code")
    print("=" * 70)
    print("\nAfter logging in and authorizing:")
    print("1. You'll be redirected to a URL like:")
    print("   http://localhost:3000/api/auth/fyers/callback?code=XXXXX")
    print("2. Copy the ENTIRE redirected URL")
    
    redirect_response = input("\n👉 Paste the redirected URL here: ").strip()
    
    # Extract auth code
    from urllib.parse import urlparse, parse_qs
    
    if not redirect_response:
        print("❌ No URL provided")
        sys.exit(1)
    
    try:
        # Check if it's a raw auth_code (starts with auth_code=)
        if redirect_response.startswith('auth_code='):
            auth_code = redirect_response.split('auth_code=')[1].split('&')[0]
            print(f"\n✓ Authorization code extracted (raw format): {auth_code[:20]}...")
        elif redirect_response.startswith('eyJ'):
            # Looks like a JWT token directly
            auth_code = redirect_response
            print(f"\n✓ Authorization code (direct JWT): {auth_code[:20]}...")
        else:
            # Parse as URL
            parsed = urlparse(redirect_response)
            auth_code = parse_qs(parsed.query).get('auth_code', [''])[0]
            
            if not auth_code:
                # Try 'code' parameter as well
                auth_code = parse_qs(parsed.query).get('code', [''])[0]
            
            if not auth_code:
                print("❌ Could not extract authorization code from URL")
                print("Please make sure you copied the complete URL or auth_code parameter")
                sys.exit(1)
            
            print(f"\n✓ Authorization code extracted: {auth_code[:20]}...")
        
    except Exception as e:
        print(f"❌ Error parsing response: {e}")
        sys.exit(1)
    
    print("\n" + "=" * 70)
    print(" STEP 3: Generate Access Token")
    print("=" * 70)
    
    # Set auth code in session
    session.set_token(auth_code)
    
    try:
        # Generate access token
        response = session.generate_token()
        
        if 'access_token' in response:
            access_token = response['access_token']
            
            print(f"\n✅ Successfully generated access token!")
            print(f"   Token: {access_token[:50]}...")
            
            # Try to decode expiry
            try:
                import jwt
                decoded = jwt.decode(access_token, options={"verify_signature": False})
                exp_timestamp = decoded.get('exp', 0)
                exp_date = datetime.fromtimestamp(exp_timestamp)
                now = datetime.now()
                
                print(f"   Expires: {exp_date}")
                print(f"   Valid for: {exp_date - now}")
            except:
                pass
            
            # Update .env file
            print("\n" + "=" * 70)
            print(" STEP 4: Save to .env")
            print("=" * 70)
            
            update_env_token(access_token)
            
            print("\n" + "=" * 70)
            print(" ✅ SUCCESS!")
            print("=" * 70)
            print("\nYour FYERS access token has been generated and saved.")
            print("\n📌 Next Steps:")
            print("   1. Restart Docker containers:")
            print("      docker compose down")
            print("      docker compose up -d")
            print("\n   2. Your application will now use the new FYERS token")
            print("\n⚠️  Note: FYERS tokens expire daily. Run this script again when needed.")
            
        else:
            print(f"\n❌ Failed to generate token")
            print(f"Response: {response}")
            
    except Exception as e:
        print(f"\n❌ Error generating token: {e}")
        print("\nPossible issues:")
        print("  • Authorization code expired (use within 5 minutes)")
        print("  • Incorrect FYERS_APP_ID or FYERS_SECRET_KEY")
        print("  • Network connection issues")
        sys.exit(1)

if __name__ == "__main__":
    main()
