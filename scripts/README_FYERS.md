# FYERS Access Token Generator

## Overview

FYERS access tokens expire **daily**. This folder contains scripts to help you generate new FYERS access tokens easily.

## Prerequisites

1. **FYERS Account**: Sign up at https://fyers.in/
2. **FYERS API Credentials**: Get from https://myapi.fyers.in/
   - App ID (e.g., `IY3SE3N6JP-100`)
   - Secret Key
3. **Python 3.7+** installed on your system

## Quick Start

### Method 1: Simple Method (Recommended) ✅

Uses the official FYERS Python SDK.

```bash
# From project root
python3 scripts/fyers_auth_simple.py
```

**Steps:**
1. Script opens browser for FYERS login
2. Login and authorize the app
3. Copy the redirected URL
4. Paste it back into the terminal
5. Token is automatically saved to `.env`

### Method 2: Manual Method

If the simple method doesn't work, use this:

```bash
python3 scripts/generate_fyers_token.py
```

## Detailed Instructions

### Setup Your Credentials (First Time Only)

1. Get your FYERS API credentials from https://myapi.fyers.in/

2. Add them to your `.env` file:
   ```env
   FYERS_APP_ID=your_app_id_here
   FYERS_SECRET_KEY=your_secret_key_here
   FYERS_REDIRECT_URI=http://localhost:3000/api/auth/fyers/callback
   ```

### Generate Access Token

1. **Run the script:**
   ```bash
   cd /Users/ajinkya/Desktop/odx
   python3 scripts/fyers_auth_simple.py
   ```

2. **Browser opens automatically** with FYERS login page
   - If it doesn't open, copy the URL from terminal

3. **Login to FYERS:**
   - Enter your FYERS username/password
   - Authorize the application

4. **Copy the redirect URL:**
   - After authorization, you'll be redirected to a URL like:
     ```
     http://localhost:3000/api/auth/fyers/callback?code=XXXXXX
     ```
   - Copy the **entire URL**

5. **Paste in terminal:**
   - Go back to terminal
   - Paste the URL when prompted
   - Press Enter

6. **Done!** ✅
   - Token is saved to `.env` automatically
   - Restart Docker containers to use new token

## Restart Services with New Token

After generating a new token:

```bash
docker compose down
docker compose up -d
```

## Token Expiry

- **FYERS tokens expire daily** (24 hours from generation)
- You'll need to regenerate the token every day
- Set up a reminder or automate it with a cron job

## Troubleshooting

### Error: "Could not extract authorization code"

**Problem:** The URL format is different than expected.

**Solution:** 
- Make sure you copy the COMPLETE redirect URL
- Check if the parameter is `code` or `auth_code`
- Try running the script again

### Error: "Failed to generate token"

**Possible causes:**
1. Authorization code expired (valid for 5 minutes only)
   - Generate a new auth code and try again faster
2. Wrong credentials in `.env`
   - Double-check `FYERS_APP_ID` and `FYERS_SECRET_KEY`
3. Network issues
   - Check your internet connection

### Error: "Module not found"

**Solution:**
```bash
pip install fyers-apiv3 python-dotenv PyJWT requests
```

### Token expires too quickly

FYERS tokens are valid for 24 hours only. You need to:
- Regenerate daily, OR
- Set up automated token refresh (advanced)

## Automated Token Refresh (Advanced)

To avoid running the script daily, you can:

1. **Set up a cron job** (macOS/Linux):
   ```bash
   crontab -e
   ```
   Add this line to run every morning at 8 AM:
   ```
   0 8 * * * cd /Users/ajinkya/Desktop/odx && /usr/bin/python3 scripts/fyers_auth_simple.py
   ```

2. **Use GitHub Actions** for cloud deployments
   - See `docs/deployment/DEPLOYMENT_FREE.md` for details

## Testing Your Token

After generating a token, test it:

```bash
# Check if services are using the token
docker compose logs -f market-data-service

# You should see: "Connected to FYERS WebSocket"
```

## Support

- **FYERS API Docs**: https://api-docs.fyers.in/
- **FYERS Support**: support@fyers.in
- **Project Issues**: Check project README.md

## Security Notes

⚠️ **Never commit your `.env` file to git!**
- It contains sensitive credentials
- Already in `.gitignore` by default
- Share tokens securely if needed

## Files in This Folder

- `fyers_auth_simple.py` - Recommended script using official SDK
- `generate_fyers_token.py` - Alternative manual method
- `README_FYERS.md` - This file

## Quick Reference

```bash
# Generate new token (simple method)
python3 scripts/fyers_auth_simple.py

# Check token expiry
python3 -c "import jwt, os; from dotenv import load_dotenv; load_dotenv(); print(jwt.decode(os.getenv('FYERS_ACCESS_TOKEN'), options={'verify_signature': False})['exp'])"

# Restart services
docker compose restart
```
