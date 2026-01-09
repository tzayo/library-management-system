#!/bin/bash

# Cleanup and Reset Script for Library Management System
# This script completely cleans and resets the application

set -e  # Exit on error

echo "=========================================="
echo "🧹 Library Management System - Cleanup"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to ask for confirmation
confirm() {
    read -p "$1 (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        return 1
    fi
    return 0
}

# Stop all running processes
echo -e "${BLUE}Step 1: Stopping all services...${NC}"
if command -v docker-compose &> /dev/null || command -v docker &> /dev/null; then
    echo "Stopping Docker containers..."
    docker-compose down 2>/dev/null || docker compose down 2>/dev/null || echo "No containers to stop"
else
    echo "Docker not available, skipping container stop"
fi

# Kill any Node processes related to this project
if pgrep -f "node.*library" &> /dev/null; then
    if confirm "Found running Node processes. Kill them?"; then
        pkill -f "node.*library" || true
        echo "Node processes terminated"
    fi
fi

echo ""

# Clean node_modules
echo -e "${BLUE}Step 2: Cleaning node_modules...${NC}"
if confirm "Remove all node_modules directories?"; then
    echo "Removing backend/node_modules..."
    rm -rf backend/node_modules
    echo "Removing frontend/node_modules..."
    rm -rf frontend/node_modules
    echo -e "${GREEN}✓ node_modules cleaned${NC}"
fi

echo ""

# Clean build artifacts
echo -e "${BLUE}Step 3: Cleaning build artifacts...${NC}"
echo "Removing build directories..."
rm -rf backend/dist
rm -rf frontend/dist
rm -rf frontend/build
echo -e "${GREEN}✓ Build artifacts cleaned${NC}"

echo ""

# Clean Docker volumes (database data)
echo -e "${BLUE}Step 4: Docker volumes and database...${NC}"
if command -v docker &> /dev/null; then
    if confirm "${RED}WARNING: This will DELETE ALL DATABASE DATA. Continue?${NC}"; then
        docker-compose down -v 2>/dev/null || docker compose down -v 2>/dev/null || true
        echo -e "${GREEN}✓ Docker volumes removed${NC}"
    else
        echo "Skipping database cleanup"
    fi
else
    echo "Docker not available, skipping volume cleanup"
fi

echo ""

# Clean environment files
echo -e "${BLUE}Step 5: Environment files...${NC}"
if confirm "Remove .env files? (You'll need to recreate them)"; then
    rm -f backend/.env
    rm -f frontend/.env
    echo -e "${GREEN}✓ Environment files removed${NC}"
else
    echo "Keeping existing .env files"
fi

echo ""

# Clean logs
echo -e "${BLUE}Step 6: Cleaning logs...${NC}"
rm -rf logs/
rm -f backend/*.log
rm -f frontend/*.log
find . -name "*.log" -type f -delete 2>/dev/null || true
echo -e "${GREEN}✓ Logs cleaned${NC}"

echo ""

# Clean lock files
echo -e "${BLUE}Step 7: Cleaning lock files...${NC}"
rm -f backend/package-lock.json
rm -f frontend/package-lock.json
rm -f backend/yarn.lock
rm -f frontend/yarn.lock
echo -e "${GREEN}✓ Lock files cleaned${NC}"

echo ""
echo "=========================================="
echo -e "${GREEN}✅ Cleanup Complete!${NC}"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Run: ${BLUE}./setup.sh${NC} - To set up the application"
echo "  2. Or manually:"
echo "     - Create .env files from .env.example"
echo "     - Run: npm install in backend and frontend"
echo "     - Start with: docker-compose up -d"
echo ""
