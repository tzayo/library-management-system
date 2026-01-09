#!/bin/bash

echo "=========================================="
echo "🔍 Library Management System - Connectivity Check"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Docker
echo "1️⃣  Checking Docker..."
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓ Docker is installed${NC}"

    if docker ps &> /dev/null; then
        echo -e "${GREEN}✓ Docker daemon is running${NC}"

        echo ""
        echo "📦 Docker Containers Status:"
        docker-compose ps

        echo ""
        echo "🏃 Running Containers:"
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    else
        echo -e "${RED}✗ Docker daemon is not running${NC}"
        echo "  Start Docker and try again"
    fi
else
    echo -e "${RED}✗ Docker is not installed${NC}"
fi

echo ""
echo "2️⃣  Checking Network Ports..."

# Check PostgreSQL (5432)
if command -v nc &> /dev/null; then
    if nc -z localhost 5432 2>/dev/null; then
        echo -e "${GREEN}✓ PostgreSQL (port 5432) is accessible${NC}"
    else
        echo -e "${RED}✗ PostgreSQL (port 5432) is not accessible${NC}"
    fi

    # Check Backend (5000)
    if nc -z localhost 5000 2>/dev/null; then
        echo -e "${GREEN}✓ Backend API (port 5000) is accessible${NC}"
    else
        echo -e "${RED}✗ Backend API (port 5000) is not accessible${NC}"
    fi

    # Check Frontend (3000)
    if nc -z localhost 3000 2>/dev/null; then
        echo -e "${GREEN}✓ Frontend (port 3000) is accessible${NC}"
    else
        echo -e "${RED}✗ Frontend (port 3000) is not accessible${NC}"
    fi
else
    echo -e "${YELLOW}⚠ netcat (nc) not available, trying curl instead${NC}"

    # Alternative check using curl
    if curl -s http://localhost:5000/api/health &> /dev/null || curl -s http://localhost:5000 &> /dev/null; then
        echo -e "${GREEN}✓ Backend API (port 5000) is responding${NC}"
    else
        echo -e "${RED}✗ Backend API (port 5000) is not responding${NC}"
    fi

    if curl -s http://localhost:3000 &> /dev/null; then
        echo -e "${GREEN}✓ Frontend (port 3000) is responding${NC}"
    else
        echo -e "${RED}✗ Frontend (port 3000) is not responding${NC}"
    fi
fi

echo ""
echo "3️⃣  Testing Backend API Endpoints..."

# Test health endpoint
if command -v curl &> /dev/null; then
    echo "Testing /api/health..."
    health_response=$(curl -s -w "\n%{http_code}" http://localhost:5000/api/health 2>/dev/null)
    http_code=$(echo "$health_response" | tail -n1)

    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✓ Health endpoint responding (200 OK)${NC}"
        echo "$health_response" | head -n-1
    else
        echo -e "${RED}✗ Health endpoint not responding properly (HTTP $http_code)${NC}"
    fi

    echo ""
    echo "Testing /api/auth/login endpoint..."
    login_response=$(curl -s -w "\n%{http_code}" -X POST http://localhost:5000/api/auth/login \
        -H "Content-Type: application/json" \
        -d '{"email":"test","password":"test"}' 2>/dev/null)
    http_code=$(echo "$login_response" | tail -n1)

    if [ "$http_code" = "400" ] || [ "$http_code" = "401" ]; then
        echo -e "${GREEN}✓ Login endpoint is responding (expecting 400/401 for invalid creds)${NC}"
    elif [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✓ Login endpoint is working${NC}"
    else
        echo -e "${RED}✗ Login endpoint issue (HTTP $http_code)${NC}"
        echo "$login_response" | head -n-1
    fi
else
    echo -e "${YELLOW}⚠ curl not available, skipping API tests${NC}"
fi

echo ""
echo "4️⃣  Checking Database Connectivity..."

# If inside Docker, check database connection
if [ -f "/.dockerenv" ] || grep -q docker /proc/1/cgroup 2>/dev/null; then
    echo "Running inside Docker container"
    if command -v psql &> /dev/null; then
        if PGPASSWORD=library_password psql -h db -U library_user -d library_system -c "SELECT 1;" &> /dev/null; then
            echo -e "${GREEN}✓ Database connection successful${NC}"
        else
            echo -e "${RED}✗ Cannot connect to database${NC}"
        fi
    fi
else
    echo "Running on host machine"
    if command -v psql &> /dev/null; then
        if PGPASSWORD=library_password psql -h localhost -U library_user -d library_system -c "SELECT 1;" &> /dev/null; then
            echo -e "${GREEN}✓ Database connection successful${NC}"

            # Check if admin user exists
            admin_count=$(PGPASSWORD=library_password psql -h localhost -U library_user -d library_system -t -c "SELECT COUNT(*) FROM users WHERE role='admin';" 2>/dev/null | tr -d ' ')
            if [ "$admin_count" -gt 0 ]; then
                echo -e "${GREEN}✓ Found $admin_count admin user(s) in database${NC}"
            else
                echo -e "${YELLOW}⚠ No admin users found in database${NC}"
            fi
        else
            echo -e "${RED}✗ Cannot connect to database${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ psql not available, cannot test database directly${NC}"
    fi
fi

echo ""
echo "5️⃣  Checking Docker Logs (last 20 lines)..."
if command -v docker &> /dev/null && docker ps &> /dev/null; then
    echo ""
    echo "--- Backend Logs ---"
    docker logs library_backend --tail 20 2>&1 || echo "Backend container not found"

    echo ""
    echo "--- Database Logs ---"
    docker logs library_db --tail 20 2>&1 || echo "Database container not found"
fi

echo ""
echo "=========================================="
echo "📋 Quick Troubleshooting Steps:"
echo "=========================================="
echo ""
echo "If services are not running:"
echo "  1. Start services: docker-compose up -d"
echo "  2. Check logs: docker-compose logs -f"
echo "  3. Restart services: docker-compose restart"
echo ""
echo "If login fails:"
echo "  1. Create admin: docker-compose exec backend npm run create-admin -- --email=admin@example.com --password=Admin123"
echo "  2. Check logs: docker logs library_backend"
echo "  3. Verify database: docker-compose exec db psql -U library_user -d library_system -c 'SELECT * FROM users;'"
echo ""
echo "If ports are blocked:"
echo "  1. Check what's using ports: sudo lsof -i :5000 -i :3000 -i :5432"
echo "  2. Stop conflicting services"
echo "  3. Restart docker-compose"
echo ""
echo "=========================================="
