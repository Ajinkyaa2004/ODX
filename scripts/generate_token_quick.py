#!/usr/bin/env python3
"""Quick script to generate FYERS access token from auth_code"""

import os
import sys
from dotenv import load_dotenv
from fyers_apiv3 import fyersModel
from datetime import datetime
import jwt

# Load environment
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
load_dotenv(env_path)

app_id = os.getenv('FYERS_APP_ID')
secret_key = os.getenv('FYERS_SECRET_KEY')
redirect_uri = os.getenv('FYERS_REDIRECT_URI', 'http://localhost:3000/api/auth/fyers/callback')

# Auth code from your FYERS authorization
auth_code = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHBfaWQiOiJJWTNTRTNONkpQIiwidXVpZCI6IjU2YTEzMzU4MDQ2YzQ2M2NhM2UyYjAwOGFlOWE2OGNjIiwiaXBBZGRyIjoiIiwibm9uY2UiOiIiLCJzY29wZSI6IiIsImRpc3BsYXlfbmFtZSI6IkZBRzk1NjUxIiwib21zIjoiSzEiLCJoc21fa2V5IjoiOGUzOWQ1ZDkzM2U3YjdkNjI3Y2FjNDE1MDdhZDNkMzk5NzkyM2ZlNjU3OTFhNjU0ZTBlODg3YjciLCJpc0RkcGlFbmFibGVkIjoiTiIsImlzTXRmRW5hYmxlZCI6Ik4iLCJhdWQiOiJbXCJkOjFcIixcImQ6MlwiLFwieDowXCIsXCJ4OjFcIixcIng6MlwiXSIsImV4cCI6MTc3MTg0OTI4OCwiaWF0IjoxNzcxODE5Mjg4LCJpc3MiOiJhcGkubG9naW4uZnllcnMuaW4iLCJuYmYiOjE3NzE4MTkyODgsInN1YiI6ImF1dGhfY29kZSJ9.nkbDWXqZbufLwo9lD4bGbyCLgn4VqmZDd396yQ583rE"

print("=" * 70)
print(" Generating FYERS Access Token")
print("=" * 70)

print(f"\n📋 Configuration:")
print(f"   App ID: {app_id}")
print(f"   Auth Code: {auth_code[:30]}...")

# Create session
session = fyersModel.SessionModel(
    client_id=app_id,
    secret_key=secret_key,
    redirect_uri=redirect_uri,
    response_type="code",
    grant_type="authorization_code"
)

# Set auth code
session.set_token(auth_code)

print("\n⏳ Generating access token...")

try:
    # Generate access token
    response = session.generate_token()
    
    if 'access_token' in response:
        access_token = response['access_token']
        
        print(f"\n✅ Successfully generated access token!")
        print(f"   Token: {access_token[:50]}...")
        
        # Decode expiry
        try:
            decoded = jwt.decode(access_token, options={"verify_signature": False})
            exp_timestamp = decoded.get('exp', 0)
            exp_date = datetime.fromtimestamp(exp_timestamp)
            now = datetime.now()
            
            print(f"   Expires: {exp_date}")
            print(f"   Valid for: {exp_date - now}")
        except Exception as e:
            print(f"   Could not decode expiry: {e}")
        
        # Update .env file
        print("\n⏳ Updating .env file...")
        
        with open(env_path, 'r') as f:
            lines = f.readlines()
        
        updated = False
        for i, line in enumerate(lines):
            if line.startswith('FYERS_ACCESS_TOKEN='):
                lines[i] = f'FYERS_ACCESS_TOKEN={access_token}\n'
                updated = True
                break
        
        if not updated:
            lines.append(f'\nFYERS_ACCESS_TOKEN={access_token}\n')
        
        with open(env_path, 'w') as f:
            f.writelines(lines)
        
        print(f"✅ Updated .env file successfully")
        
        print("\n" + "=" * 70)
        print(" ✅ SUCCESS!")
        print("=" * 70)
        print("\n📌 Next Steps:")
        print("   1. Restart Docker containers:")
        print("      docker compose down")
        print("      docker compose up -d")
        print("\n   2. Your application will now use the new FYERS token")
        print("\n⚠️  Note: FYERS tokens expire daily.")
        
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
