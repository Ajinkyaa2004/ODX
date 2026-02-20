#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "========================================="
echo "  SERVICE HEALTH CHECK SCRIPT"
echo "========================================="
echo ""

# Check if services are running
check_service() {
    SERVICE_NAME=$1
    URL=$2
    
    echo -n "Checking $SERVICE_NAME... "
    
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $URL 2>/dev/null)
    
    if [ "$RESPONSE" = "200" ]; then
        echo -e "${GREEN}✓ UP (200 OK)${NC}"
        return 0
    else
        echo -e "${RED}✗ DOWN (Status: $RESPONSE)${NC}"
        return 1
    fi
}

# Check all services
echo "Backend Services:"
echo "-------------------"
check_service "API Gateway       " "http://localhost:8080/actuator/health"
check_service "Market Data       " "http://localhost:8081/actuator/health"
check_service "Option Chain      " "http://localhost:8082/actuator/health"
check_service "Risk Service      " "http://localhost:8083/actuator/health"
check_service "Journal Service   " "http://localhost:8084/actuator/health"
check_service "Quant Engine      " "http://localhost:8001/health"
check_service "AI Reasoning      " "http://localhost:8002/health"

echo ""
echo "Frontend:"
echo "-------------------"
check_service "Next.js Frontend  " "http://localhost:3000"

echo ""
echo "========================================="
echo "Health check complete!"
echo "========================================="
