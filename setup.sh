#!/bin/bash

# Setup Script for Library Management System
# This script sets up the application from scratch

set -e  # Exit on error

echo "=========================================="
echo "🚀 Library Management System - Setup"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Docker is available
DOCKER_AVAILABLE=false
if command -v docker &> /dev/null && docker ps &> /dev/null 2>&1; then
    DOCKER_AVAILABLE=true
fi

# Step 1: Choose installation method
echo -e "${BLUE}Choose installation method:${NC}"
echo "1) Docker (Recommended - Includes PostgreSQL)"
echo "2) Local Development (Requires PostgreSQL installed)"
echo ""
read -p "Enter choice (1 or 2): " INSTALL_METHOD

if [ "$INSTALL_METHOD" = "1" ] && [ "$DOCKER_AVAILABLE" = false ]; then
    echo -e "${RED}Error: Docker is not available or not running${NC}"
    echo "Please install Docker or choose option 2 for local development"
    exit 1
fi

echo ""

# Step 2: Backend setup
echo -e "${BLUE}Step 1: Setting up Backend...${NC}"
cd backend

if [ ! -f ".env" ]; then
    echo "Creating backend/.env from template..."
    cp .env.example .env

    if [ "$INSTALL_METHOD" = "2" ]; then
        echo "Configuring for local development..."
        # Ensure DB_HOST is localhost for local development
        sed -i 's/DB_HOST=.*/DB_HOST=localhost/' .env 2>/dev/null || \
        sed -i '' 's/DB_HOST=.*/DB_HOST=localhost/' .env 2>/dev/null || true
    else
        echo "Configuring for Docker..."
        sed -i 's/DB_HOST=.*/DB_HOST=db/' .env 2>/dev/null || \
        sed -i '' 's/DB_HOST=.*/DB_HOST=db/' .env 2>/dev/null || true
    fi

    echo -e "${GREEN}✓ backend/.env created${NC}"
else
    echo -e "${YELLOW}backend/.env already exists, skipping${NC}"
fi

echo "Installing backend dependencies..."
npm install
echo -e "${GREEN}✓ Backend dependencies installed${NC}"

cd ..
echo ""

# Step 3: Frontend setup
echo -e "${BLUE}Step 2: Setting up Frontend...${NC}"
cd frontend

if [ ! -f ".env" ]; then
    echo "Creating frontend/.env from template..."
    cp .env.example .env
    echo -e "${GREEN}✓ frontend/.env created${NC}"
else
    echo -e "${YELLOW}frontend/.env already exists, skipping${NC}"
fi

echo "Installing frontend dependencies..."
npm install
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"

cd ..
echo ""

# Step 4: Start services
if [ "$INSTALL_METHOD" = "1" ]; then
    echo -e "${BLUE}Step 3: Starting Docker services...${NC}"
    docker-compose up -d

    echo ""
    echo "Waiting for services to be ready..."
    sleep 5

    echo ""
    echo "Checking service health..."
    docker-compose ps

    echo ""
    echo -e "${GREEN}✓ Docker services started${NC}"

    echo ""
    echo -e "${BLUE}Step 4: Creating admin user...${NC}"
    echo "Please enter admin details:"
    read -p "Email: " ADMIN_EMAIL
    read -sp "Password (min 8 chars, include number): " ADMIN_PASSWORD
    echo ""
    read -p "Full Name [Admin User]: " ADMIN_NAME
    ADMIN_NAME=${ADMIN_NAME:-Admin User}

    echo ""
    echo "Creating admin user..."
    docker-compose exec -T backend npm run create-admin -- --email="$ADMIN_EMAIL" --password="$ADMIN_PASSWORD" --name="$ADMIN_NAME" || {
        echo -e "${YELLOW}Note: If creation failed, wait a moment for DB to be ready, then run:${NC}"
        echo "  docker-compose exec backend npm run create-admin -- --email=$ADMIN_EMAIL --password=YourPassword --name=\"$ADMIN_NAME\""
    }

else
    echo -e "${BLUE}Step 3: Local Development Setup${NC}"
    echo ""
    echo -e "${YELLOW}IMPORTANT: PostgreSQL must be installed and running${NC}"
    echo ""

    # Check PostgreSQL
    cd backend
    echo "Running prerequisites check..."
    npm run check || {
        echo ""
        echo -e "${RED}Prerequisites check failed!${NC}"
        echo ""
        echo "To install PostgreSQL:"
        echo "  Ubuntu/Debian: sudo apt install postgresql && sudo service postgresql start"
        echo "  macOS: brew install postgresql@15 && brew services start postgresql@15"
        echo ""
        echo "Then create database:"
        echo "  sudo -u postgres psql -c \"CREATE DATABASE library_system;\""
        echo "  sudo -u postgres psql -c \"CREATE USER library_user WITH PASSWORD 'library_password';\""
        echo "  sudo -u postgres psql -c \"GRANT ALL PRIVILEGES ON DATABASE library_system TO library_user;\""
        echo ""
        exit 1
    }

    echo ""
    echo -e "${BLUE}Step 4: Creating admin user...${NC}"
    echo "Please enter admin details:"
    read -p "Email: " ADMIN_EMAIL
    read -sp "Password (min 8 chars, include number): " ADMIN_PASSWORD
    echo ""
    read -p "Full Name [Admin User]: " ADMIN_NAME
    ADMIN_NAME=${ADMIN_NAME:-Admin User}

    echo ""
    npm run create-admin -- --email="$ADMIN_EMAIL" --password="$ADMIN_PASSWORD" --name="$ADMIN_NAME"

    cd ..

    echo ""
    echo -e "${BLUE}To start the application:${NC}"
    echo "  Terminal 1: cd backend && npm run dev"
    echo "  Terminal 2: cd frontend && npm run dev"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo "=========================================="
echo ""

if [ "$INSTALL_METHOD" = "1" ]; then
    echo "Access the application:"
    echo "  - Frontend: ${BLUE}http://localhost:3000${NC}"
    echo "  - Backend API: ${BLUE}http://localhost:5000${NC}"
    echo "  - Health Check: ${BLUE}http://localhost:5000/health${NC}"
    echo ""
    echo "Useful commands:"
    echo "  - View logs: docker-compose logs -f"
    echo "  - Stop services: docker-compose down"
    echo "  - Restart: docker-compose restart"
else
    echo "To start the application, run in separate terminals:"
    echo "  Terminal 1: cd backend && npm run dev"
    echo "  Terminal 2: cd frontend && npm run dev"
    echo ""
    echo "Then access:"
    echo "  - Frontend: ${BLUE}http://localhost:3000${NC}"
    echo "  - Backend API: ${BLUE}http://localhost:5000${NC}"
fi

echo ""
echo "Login with your admin credentials:"
echo "  Email: $ADMIN_EMAIL"
echo ""
