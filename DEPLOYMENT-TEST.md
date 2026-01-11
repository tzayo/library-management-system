# 🧪 Deployment Testing Guide

This document outlines the steps to test the Library Management System deployment after configuration changes.

## 🔄 Deployment Steps

### 1. Stop and Remove Existing Containers

```bash
# Stop all running containers
docker-compose down

# Optional: Remove volumes to start fresh (WARNING: Deletes all data!)
docker-compose down -v
```

### 2. Rebuild and Start Services

```bash
# Rebuild all containers with new configuration
docker-compose up -d --build

# This will:
# - Rebuild the frontend with nginx on port 80 (exposed as 3001)
# - Rebuild the backend with updated CORS for port 3001
# - Start PostgreSQL database
```

### 3. Monitor Startup

```bash
# Watch logs as services start
docker-compose logs -f

# Or watch specific service
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f db
```

Wait for these success messages:
- ✅ Backend: "🚀 Server started successfully!"
- ✅ Frontend: nginx started
- ✅ Database: "database system is ready to accept connections"

## ✅ Testing Checklist

### 1. Container Health Check

```bash
# Verify all containers are running
docker-compose ps

# Expected output:
# library_frontend   running   0.0.0.0:3001->80/tcp
# library_backend    running   0.0.0.0:5000->5000/tcp
# library_db         running   0.0.0.0:5432->5432/tcp
```

### 2. Backend API Health

```bash
# Test backend health endpoint
curl http://localhost:5000/health

# Expected response:
# {
#   "success": true,
#   "message": "Server is running",
#   "timestamp": "...",
#   "environment": "production"
# }
```

### 3. Frontend Accessibility

```bash
# Test frontend is serving
curl -I http://localhost:3001

# Expected response:
# HTTP/1.1 200 OK
# Server: nginx
```

### 4. Frontend → Backend Connectivity

**Browser Test:**

1. Open http://localhost:3001 in your browser
2. Open browser DevTools (F12) → Network tab
3. Try to login with credentials:
   - Email: `admin@library.com`
   - Password: `Admin123!`
4. Check Network tab for API call to `/api/auth/login`
5. Should see **Status: 200 OK** (not CORS errors)

### 5. CORS Configuration Test

```bash
# Test CORS headers from frontend origin
curl -H "Origin: http://localhost:3001" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     http://localhost:5000/api/auth/login -v

# Expected in response headers:
# Access-Control-Allow-Origin: http://localhost:3001
# Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH
```

### 6. Login Functionality Test

**Via Browser:**

1. Navigate to http://localhost:3001
2. You should see the login page
3. Enter credentials:
   - **Email:** admin@library.com
   - **Password:** Admin123!
4. Click "Login"
5. ✅ Should redirect to dashboard (NOT see CORS errors)
6. ✅ Should see user menu in top right
7. ✅ Should see sidebar with navigation

**Via API:**

```bash
# Test login via API
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@library.com",
    "password": "Admin123!"
  }'

# Expected response:
# {
#   "success": true,
#   "token": "eyJhbGc...",
#   "user": {
#     "id": 1,
#     "email": "admin@library.com",
#     "name": "System Administrator",
#     "role": "Admin"
#   }
# }
```

### 7. Database Connectivity Test

```bash
# Connect to database
docker exec -it library_db psql -U library_user -d library_system

# Run test query
SELECT COUNT(*) FROM "Users";

# Should show at least 1 user (the admin)
# Exit with: \q
```

### 8. Full Integration Test

1. **Login** → Should work ✅
2. **View Books Page** → Should load ✅
3. **Add a Book** (as admin):
   - Click "Books" → "Add Book"
   - Fill in details
   - Save
   - Should see success message ✅
4. **View Users Page** → Should show admin user ✅
5. **Logout** → Should return to login page ✅

## 🐛 Common Issues and Fixes

### Issue: "Cannot access http://localhost:3001"

**Diagnosis:**
```bash
docker-compose logs frontend
```

**Possible causes:**
- Frontend container failed to build
- Port 3001 already in use
- nginx not starting

**Fix:**
```bash
# Check if port is in use
lsof -i :3001

# Rebuild frontend
docker-compose up -d --build frontend
```

### Issue: "CORS error when trying to login"

**Diagnosis:**
```bash
docker-compose logs backend | grep CORS
docker-compose logs backend | grep FRONTEND
```

**Check:**
- Backend should show: `FRONTEND_URL: http://localhost:3001`

**Fix:**
```bash
# Ensure backend has correct FRONTEND_URL
docker exec -it library_backend env | grep FRONTEND_URL

# Should show: FRONTEND_URL=http://localhost:3001

# If incorrect, rebuild:
docker-compose down
docker-compose up -d --build backend
```

### Issue: "Login credentials not working"

**Diagnosis:**
```bash
# Check if admin user was created
docker exec -it library_db psql -U library_user -d library_system -c \
  "SELECT id, email, name, role FROM \"Users\" WHERE role='Admin';"
```

**Fix:**
```bash
# Manually create admin user
docker exec -it library_backend npm run create-admin -- \
  --email=admin@library.com \
  --password=Admin123! \
  --name="System Administrator"
```

### Issue: "Frontend shows white screen"

**Diagnosis:**
```bash
# Check nginx logs
docker-compose logs frontend

# Check browser console for errors
# Open DevTools → Console tab
```

**Fix:**
```bash
# Rebuild frontend with --no-cache
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

## 📊 Performance Tests

### Response Time Test

```bash
# Test backend response time
time curl http://localhost:5000/health

# Should respond in < 100ms

# Test frontend response time
time curl http://localhost:3001

# Should respond in < 50ms (nginx is fast!)
```

### Load Test (Optional)

```bash
# Install apache-bench if not available
# Ubuntu: sudo apt install apache2-utils
# macOS: brew install apache-bench

# Test backend under load
ab -n 100 -c 10 http://localhost:5000/health

# Test frontend under load
ab -n 100 -c 10 http://localhost:3001/
```

## ✅ Test Results Template

Use this checklist to document your test results:

- [ ] All containers running (docker-compose ps)
- [ ] Backend health check responds 200 OK
- [ ] Frontend accessible on http://localhost:3001
- [ ] CORS headers correct (includes http://localhost:3001)
- [ ] Login page loads without errors
- [ ] Login with admin credentials succeeds
- [ ] Dashboard loads after login
- [ ] Can navigate to Books page
- [ ] Can navigate to Users page
- [ ] Can logout successfully
- [ ] Database has admin user
- [ ] No CORS errors in browser console
- [ ] No errors in backend logs
- [ ] No errors in frontend logs

## 🎉 Success Criteria

Your deployment is successful when:

1. ✅ All containers are running and healthy
2. ✅ Frontend accessible at http://localhost:3001
3. ✅ Backend API responding at http://localhost:5000
4. ✅ Login works without CORS errors
5. ✅ All main pages load correctly
6. ✅ No errors in browser console
7. ✅ No errors in Docker logs

---

**Next Steps After Successful Testing:**
- Change default admin password
- Add your books and users
- Configure email reminders (optional)
- Set up regular database backups
