# 🚀 Library Management System - Complete Installation Guide

This guide will walk you through deploying the complete Library Management System using Docker, with everything configured correctly for immediate use.

## 📋 Prerequisites

Before starting, ensure you have the following installed:

- **Docker** (version 20.10 or higher)
- **Docker Compose** (version 2.0 or higher)
- **Git**

### Verify Prerequisites

```bash
# Check Docker
docker --version
docker-compose --version

# Check Git
git --version
```

## 🎯 Quick Start (5 Minutes)

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd library-management-system
```

### Step 2: Configure Environment Variables

#### Backend Configuration

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` with your preferred text editor:

```env
# Database Configuration
DB_HOST=db
DB_PORT=5432
DB_NAME=library_system
DB_USER=library_user
DB_PASSWORD=library_password

# JWT Secret (CHANGE THIS IN PRODUCTION!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Admin Credentials (First admin user)
ADMIN_EMAIL=admin@library.com
ADMIN_PASSWORD=Admin123!
ADMIN_NAME=System Administrator

# Email Configuration (Optional)
EMAIL_ENABLED=false
# Uncomment and configure if you want email reminders
# EMAIL_USER=your-email@gmail.com
# EMAIL_PASSWORD=your-gmail-app-password
```

**Security Note:** Always change the `JWT_SECRET` and `ADMIN_PASSWORD` in production!

#### Frontend Configuration

```bash
cd ../frontend
cp .env.example .env
```

Edit `frontend/.env`:

```env
# API URL (matches backend service)
VITE_API_URL=http://localhost:5000/api
```

### Step 3: Start the System

```bash
# Return to project root
cd ..

# Start all services
docker-compose up -d
```

This command will:
- ✅ Start PostgreSQL database
- ✅ Build and start the backend API
- ✅ Build and start the frontend
- ✅ Create the default admin user
- ✅ Set up the database schema

### Step 4: Verify Installation

Wait about 30 seconds for all services to start, then check:

```bash
# Check running containers
docker-compose ps

# You should see 3 containers running:
# - library_db (PostgreSQL)
# - library_backend (Node.js API)
# - library_frontend (React app)

# Check backend health
curl http://localhost:5000/health

# Expected response:
# {"success":true,"message":"Server is running","timestamp":"...","environment":"production"}
```

### Step 5: Access the Application

Open your browser and navigate to:

**🌐 Frontend:** http://localhost:3001

**Default Login Credentials:**
- **Email:** `admin@library.com`
- **Password:** `Admin123!`

**Backend API:** http://localhost:5000/api

## 🔧 Configuration Details

### Port Configuration

The system uses the following ports:

| Service    | Host Port | Container Port | URL                        |
|------------|-----------|----------------|----------------------------|
| Frontend   | 3001      | 3000           | http://localhost:3001      |
| Backend    | 5000      | 5000           | http://localhost:5000      |
| PostgreSQL | 5432      | 5432           | localhost:5432             |

### Docker Services

#### Database (PostgreSQL 15)
- **Container:** `library_db`
- **Volume:** `postgres_data` (persistent storage)
- **Credentials:** Defined in `docker-compose.yml`

#### Backend (Node.js + Express)
- **Container:** `library_backend`
- **Environment:** Production mode
- **Auto-creates admin user on first start**

#### Frontend (React + Vite)
- **Container:** `library_frontend`
- **Proxies API requests to backend**

## 📝 Post-Installation Steps

### 1. Verify Login Works

1. Go to http://localhost:3001
2. You should see the login page
3. Enter the default credentials:
   - Email: `admin@library.com`
   - Password: `Admin123!`
4. Click "Login"
5. You should be redirected to the dashboard

### 2. Change Default Password

**Important:** Change the default admin password immediately!

1. After logging in, click on your profile (top right)
2. Select "Change Password"
3. Enter a strong new password
4. Save changes

### 3. Create Additional Users (Optional)

As an admin, you can create additional users:

1. Navigate to "Users" in the sidebar
2. Click "Add User"
3. Fill in user details
4. Assign appropriate role:
   - **User:** Can view and borrow books
   - **Editor:** Can manage books and loans
   - **Admin:** Full system access

## 🔍 Troubleshooting

### Issue: Containers won't start

```bash
# Check logs
docker-compose logs

# Check specific service
docker-compose logs backend
docker-compose logs frontend
docker-compose logs db
```

### Issue: "Connection refused" when accessing frontend

```bash
# Ensure frontend container is running
docker-compose ps

# Restart frontend service
docker-compose restart frontend

# Check if port 3001 is available
lsof -i :3001  # macOS/Linux
netstat -ano | findstr :3001  # Windows
```

### Issue: "Cannot connect to backend" error

```bash
# Verify backend is healthy
curl http://localhost:5000/health

# Check backend logs
docker-compose logs backend

# Restart backend service
docker-compose restart backend
```

### Issue: Login fails with "Invalid credentials"

The admin user is created automatically when the backend starts. If it's not working:

```bash
# Recreate admin user manually
docker exec -it library_backend npm run create-admin -- \
  --email=admin@library.com \
  --password=Admin123! \
  --name="System Administrator"
```

### Issue: Database connection errors

```bash
# Check database is running
docker-compose ps db

# Restart database
docker-compose restart db

# If database is corrupted, reset it:
docker-compose down -v  # WARNING: This deletes all data!
docker-compose up -d
```

## 🛑 Stopping the System

### Stop all services (keeps data)
```bash
docker-compose down
```

### Stop and remove all data
```bash
docker-compose down -v
```

## 🔄 Updating the System

### Pull latest changes
```bash
git pull origin main
```

### Rebuild and restart
```bash
docker-compose down
docker-compose up -d --build
```

## 📊 Useful Commands

### View logs (follow mode)
```bash
docker-compose logs -f
```

### View logs for specific service
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Access backend container shell
```bash
docker exec -it library_backend sh
```

### Access database
```bash
docker exec -it library_db psql -U library_user -d library_system
```

### Create additional admin users
```bash
docker exec -it library_backend npm run create-admin -- \
  --email=admin2@library.com \
  --password=SecurePass123! \
  --name="Another Admin"
```

### Check database tables
```bash
docker exec -it library_db psql -U library_user -d library_system -c "\dt"
```

## 🔐 Security Checklist

Before deploying to production:

- [ ] Change `JWT_SECRET` in `backend/.env`
- [ ] Change default admin password
- [ ] Use strong database password
- [ ] Configure HTTPS/SSL
- [ ] Set up firewall rules
- [ ] Enable email notifications
- [ ] Configure regular backups
- [ ] Review and update CORS settings if needed

## 📧 Email Configuration (Optional)

To enable email reminders for overdue books:

1. **Get Gmail App Password:**
   - Go to Google Account settings
   - Security → 2-Step Verification (enable if not already)
   - Security → App Passwords
   - Generate new app password for "Mail"

2. **Update backend/.env:**
   ```env
   EMAIL_ENABLED=true
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-16-char-app-password
   ```

3. **Restart backend:**
   ```bash
   docker-compose restart backend
   ```

## 📚 Next Steps

Now that your system is running:

1. **Add Books:** Navigate to "Books" → "Add Book"
2. **Register Users:** Go to "Users" → "Add User"
3. **Create Loans:** Use "Loans" → "New Loan"
4. **Configure Settings:** Check "Settings" for system preferences

## 🧪 Testing Your Deployment

For a comprehensive testing guide, see [DEPLOYMENT-TEST.md](DEPLOYMENT-TEST.md)

Quick verification:
```bash
# 1. Check all containers are running
docker-compose ps

# 2. Test backend
curl http://localhost:5000/health

# 3. Test frontend
curl -I http://localhost:3001

# 4. Login via browser at http://localhost:3001
```

## 🆘 Getting Help

If you encounter issues not covered in this guide:

1. Check the [Deployment Testing Guide](DEPLOYMENT-TEST.md) for detailed troubleshooting
2. Review the logs: `docker-compose logs`
3. Check the [Troubleshooting Guide](TROUBLESHOOTING.md)
4. Check the [Database Guide](DATABASE-GUIDE.md)
5. Open an issue on GitHub

## ✅ Installation Complete!

You should now have a fully functional Library Management System running at:

**🌐 http://localhost:3001**

Happy managing! 📚
