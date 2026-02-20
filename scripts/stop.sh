#!/bin/bash

echo "========================================="
echo "  STOPPING ALL SERVICES"
echo "========================================="
echo ""

docker-compose down

echo ""
echo "✓ All services stopped"
echo "========================================="
