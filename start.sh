#!/bin/bash

# Stop and remove old containers
docker-compose down

# Remove any lingering containers
docker ps -a --filter "name=intraday-" -q | xargs -r docker rm -f

# Start all services
docker-compose up --build

# ./start.sh