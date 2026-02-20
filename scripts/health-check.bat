@echo off
REM Windows batch file for health check

echo =========================================
echo   SERVICE HEALTH CHECK SCRIPT
echo =========================================
echo.

echo Backend Services:
echo -------------------
curl -s http://localhost:8080/health >nul 2>&1 && echo API Gateway       - UP || echo API Gateway       - DOWN
curl -s http://localhost:8081/health >nul 2>&1 && echo Market Data       - UP || echo Market Data       - DOWN
curl -s http://localhost:8082/health >nul 2>&1 && echo Option Chain      - UP || echo Option Chain      - DOWN
curl -s http://localhost:8083/health >nul 2>&1 && echo Risk Service      - UP || echo Risk Service      - DOWN
curl -s http://localhost:8084/health >nul 2>&1 && echo Journal Service   - UP || echo Journal Service   - DOWN
curl -s http://localhost:8001/health >nul 2>&1 && echo Quant Engine      - UP || echo Quant Engine      - DOWN
curl -s http://localhost:8002/health >nul 2>&1 && echo AI Reasoning      - UP || echo AI Reasoning      - DOWN

echo.
echo Frontend:
echo -------------------
curl -s http://localhost:3000 >nul 2>&1 && echo Next.js Frontend  - UP || echo Next.js Frontend  - DOWN

echo.
echo =========================================
echo Health check complete!
echo =========================================
pause
