#!/bin/bash

# Quick start script for local development
echo "========================================="
echo "  STARTING INTRADAY DECISION ENGINE"
echo "========================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  Warning: .env file not found!"
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo "✓ Created .env file"
    echo "⚠️  Please configure your API keys in .env before proceeding!"
    echo ""
    read -p "Press Enter to continue or Ctrl+C to exit..."
fi

echo "Starting services with Docker Compose..."
echo ""

# Start all services
docker-compose up --build

echo ""
echo "========================================="
echo "All services stopped"
echo "========================================="
