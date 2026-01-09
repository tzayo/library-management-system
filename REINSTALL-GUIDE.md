# 🔄 Complete Reinstall Guide

This guide walks you through completely cleaning up and reinstalling the Library Management System.

## 🎯 Quick Start

```bash
# 1. Clean everything
./cleanup.sh

# 2. Set up fresh installation
./setup.sh
```

That's it! The scripts will guide you through the process.

---

## 📖 Manual Step-by-Step Guide

If you prefer to do it manually or want to understand what's happening:

### Step 1: Stop Everything

```bash
# Stop Docker containers
docker-compose down

# Kill any running Node processes
pkill -f "node.*library" || true
```

### Step 2: Clean Installation

```bash
# Remove node_modules
rm -rf backend/node_modules
rm -rf frontend/node_modules

# Remove lock files
rm -f backend/package-lock.json
rm -f frontend/package-lock.json

# Remove build artifacts
rm -rf backend/dist
rm -rf frontend/dist
```

### Step 3: Clean Database (Optional)

**⚠️ WARNING: This deletes ALL data!**

```bash
# Remove Docker volumes (includes database)
docker-compose down -v

# The database will be recreated when you start again
```

### Step 4: Clean Environment Files (Optional)

```bash
# Remove .env files (you'll recreate them)
rm -f backend/.env
rm -f frontend/.env
```

### Step 5: Create Environment Files

**Backend:**
```bash
cd backend
cp .env.example .env

# Edit .env and configure:
# - For Docker: DB_HOST=db
# - For Local: DB_HOST=localhost
nano .env  # or use your preferred editor
```

**Frontend:**
```bash
cd ../frontend
cp .env.example .env

# Usually you don't need to edit this
# Default: VITE_API_URL=http://localhost:5000/api
```

### Step 6: Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### Step 7: Start Services

**Option A: Using Docker (Recommended)**
```bash
cd ..
docker-compose up -d

# Wait for services to start (about 10 seconds)
sleep 10

# Check status
docker-compose ps
```

**Option B: Local Development**
```bash
# Make sure PostgreSQL is running
sudo service postgresql status

# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Step 8: Create Admin User

**Using Docker:**
```bash
docker-compose exec backend npm run create-admin -- \
  --email=admin@library.com \
  --password=Admin123! \
  --name="System Admin"
```

**Without Docker:**
```bash
cd backend
npm run create-admin -- \
  --email=admin@library.com \
  --password=Admin123! \
  --name="System Admin"
```

### Step 9: Verify Installation

1. **Check backend health:**
   ```bash
   curl http://localhost:5000/health
   ```
   Should return: `{"status":"healthy","database":"connected"}`

2. **Access frontend:**
   Open browser to: http://localhost:3000

3. **Try to login:**
   - Go to: http://localhost:3000/login
   - Use your admin credentials

---

## 🔍 Troubleshooting Login Issues

### Issue: Can't access http://localhost:3000/login

**Possible causes:**

1. **Frontend not running**
   ```bash
   # Check if frontend is running
   curl http://localhost:3000

   # Or check Docker
   docker-compose ps
   ```

2. **Wrong port**
   - Default frontend port is **3000**, not 3001
   - Check `docker-compose.yml` or `frontend/.env`

3. **Frontend build failed**
   ```bash
   # Check frontend logs
   docker-compose logs frontend

   # Or if running locally
   cd frontend
   npm run dev
   ```

### Issue: Login returns error or doesn't work

1. **Backend not running:**
   ```bash
   # Check backend
   curl http://localhost:5000/api/auth/login

   # Should return error about missing credentials, not connection error
   ```

2. **No admin user:**
   ```bash
   # Check if admin exists
   docker-compose exec db psql -U library_user -d library_system -c \
     "SELECT email, role FROM users WHERE role='admin';"
   ```

3. **Database not connected:**
   ```bash
   # Check backend logs
   docker-compose logs backend | grep -i database
   ```

### Issue: Port 3001 instead of 3000

If you're accessing port 3001, check if you changed the port in `docker-compose.yml`:

```yaml
# In docker-compose.yml
frontend:
  ports:
    - "3000:3000"  # Should be 3000, not 3001
```

If you intentionally use 3001, make sure to:
1. Update `docker-compose.yml` frontend ports to `"3001:3000"`
2. Update `backend/.env`: `FRONTEND_URL=http://localhost:3001`

---

## 📊 Checking What's Installed

### Check Node.js Version
```bash
node --version  # Should be v20+
```

### Check if Services are Running

**Docker:**
```bash
docker-compose ps

# Should show:
# - library_db (PostgreSQL)
# - library_backend
# - library_frontend
```

**Local:**
```bash
# Check PostgreSQL
sudo service postgresql status

# Check Node processes
ps aux | grep node
```

### Check Database

```bash
# Using Docker
docker-compose exec db psql -U library_user -d library_system -c "\dt"

# Local
psql -h localhost -U library_user -d library_system -c "\dt"

# Should show tables: users, books, loans
```

### Check if Admin Exists

```bash
# Using Docker
docker-compose exec db psql -U library_user -d library_system -c \
  "SELECT email, \"fullName\", role FROM users WHERE role='admin';"

# Local
psql -h localhost -U library_user -d library_system -c \
  "SELECT email, \"fullName\", role FROM users WHERE role='admin';"
```

---

## 🧪 Test the Installation

Run this comprehensive test:

```bash
#!/bin/bash

echo "Testing Library Management System Installation..."
echo ""

# Test 1: Backend Health
echo "1. Testing backend health..."
if curl -s http://localhost:5000/health | grep -q "healthy"; then
    echo "   ✅ Backend is healthy"
else
    echo "   ❌ Backend health check failed"
fi

# Test 2: Frontend Accessibility
echo "2. Testing frontend..."
if curl -s http://localhost:3000 | grep -q "Library"; then
    echo "   ✅ Frontend is accessible"
else
    echo "   ❌ Frontend not accessible"
fi

# Test 3: Database Connection
echo "3. Testing database..."
if docker-compose exec -T db psql -U library_user -d library_system -c "SELECT 1;" &>/dev/null; then
    echo "   ✅ Database is accessible"
else
    echo "   ❌ Database connection failed"
fi

# Test 4: Admin User
echo "4. Checking admin user..."
ADMIN_COUNT=$(docker-compose exec -T db psql -U library_user -d library_system -t -c "SELECT COUNT(*) FROM users WHERE role='admin';" 2>/dev/null | tr -d ' \n')
if [ "$ADMIN_COUNT" -gt 0 ]; then
    echo "   ✅ Admin user exists"
else
    echo "   ❌ No admin user found"
fi

echo ""
echo "Installation test complete!"
```

Save as `test-installation.sh`, make executable with `chmod +x test-installation.sh`, and run it.

---

## 🆘 Still Having Issues?

1. **Run diagnostics:**
   ```bash
   cd backend
   npm run check
   ```

2. **Check connectivity:**
   ```bash
   ./check-connectivity.sh
   ```

3. **View detailed logs:**
   ```bash
   docker-compose logs -f
   ```

4. **See troubleshooting guide:**
   - Read [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
   - Read [DATABASE-GUIDE.md](DATABASE-GUIDE.md)

---

## 📝 Common Scenarios

### Scenario 1: Fresh Install on New Machine

```bash
git clone <repository-url>
cd library-management-system
./setup.sh
```

### Scenario 2: Reset After Development

```bash
./cleanup.sh  # Answer 'y' to all prompts
./setup.sh
```

### Scenario 3: Just Reset Database, Keep Code

```bash
docker-compose down -v
docker-compose up -d
docker-compose exec backend npm run create-admin -- --email=admin@test.com --password=Admin123
```

### Scenario 4: Change from Local to Docker

```bash
# Stop local processes
pkill -f "node.*library"

# Update backend/.env
sed -i 's/DB_HOST=localhost/DB_HOST=db/' backend/.env

# Start Docker
docker-compose up -d
```

### Scenario 5: Change from Docker to Local

```bash
# Stop Docker
docker-compose down

# Update backend/.env
sed -i 's/DB_HOST=db/DB_HOST=localhost/' backend/.env

# Start PostgreSQL
sudo service postgresql start

# Run locally
cd backend && npm run dev &
cd frontend && npm run dev &
```

---

**Last Updated:** 2026-01-09
