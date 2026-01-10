# Library Management System - Setup Guide

## Overview
This guide explains how to set up the database, create users (regular and admin), and understand the authentication flow.

---

## 1. Environment Configuration

### Backend `.env` File
Location: `/backend/.env`

**Key Configuration Values:**

```env
# Server Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000  # ✅ You CAN enter this value now!

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=library_system
DB_USER=library_user
DB_PASSWORD=library_password

# JWT Configuration (CHANGE THESE IN PRODUCTION!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
```

**Important Notes:**
- ✅ The `.env` files have been created from `.env.example`
- The `FRONTEND_URL=http://localhost:3000` is already set correctly
- You can now edit these values as needed
- In production, generate a secure JWT secret using:
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```

### Frontend `.env` File
Location: `/frontend/.env`

```env
VITE_API_URL=http://localhost:5000/api
```

---

## 2. Database Setup

### Option A: Using Docker (Recommended)

If you have Docker installed:

```bash
# Start PostgreSQL database
docker-compose up -d

# The database will be available at:
# - Host: localhost
# - Port: 5432
# - Database: library_system
# - User: library_user
# - Password: library_password
```

### Option B: Local PostgreSQL Installation

If Docker is not available, install PostgreSQL locally:

**On Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**On macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Create Database and User:**
```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL console:
CREATE DATABASE library_system;
CREATE USER library_user WITH PASSWORD 'library_password';
GRANT ALL PRIVILEGES ON DATABASE library_system TO library_user;
\q
```

**Verify Connection:**
```bash
# Check if PostgreSQL is running
pg_isready -h localhost -p 5432

# Expected output: "localhost:5432 - accepting connections"
```

### Initialize Database Tables

Once PostgreSQL is running:

```bash
cd backend

# Install dependencies (if not already done)
npm install

# Run database migration
npm run db:migrate

# This will create all necessary tables:
# - users
# - books
# - loans
# - authors
# - categories
```

---

## 3. User Creation

### A. Creating Regular Users (as User)

Regular users can self-register through the API:

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "fullName": "John Doe",
  "phone": "+1234567890"
}
```

**Validation Rules:**
- Email: Must be valid format
- Password: Minimum 8 characters, must contain at least one digit
- Full Name: Minimum 2 characters, required
- Phone: Optional

**Role Assignment:**
- All self-registered users automatically get `role: 'user'`
- Regular users CANNOT register as admin or editor

**Response:**
```json
{
  "token": "jwt-token-here",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "John Doe",
    "role": "user",
    "isActive": true
  }
}
```

**Using cURL:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123",
    "fullName": "John Doe",
    "phone": "+1234567890"
  }'
```

### B. Creating Admin Users (as Admin)

**Method 1: Using the Admin Creation Script** (Recommended for first admin)

```bash
cd backend

# Create admin user
npm run create-admin -- --email=admin@example.com --password=AdminPass123 --name="Admin User"

# With phone number (optional)
npm run create-admin -- --email=admin@example.com --password=AdminPass123 --name="Admin User" --phone="+1234567890"
```

**Script Features:**
- ✅ Validates email format and password strength
- ✅ Checks if user already exists
- ✅ Automatically sets `role: 'admin'`
- ✅ Sets `isActive: true`
- ✅ Hashes password automatically with bcrypt (12 rounds)
- ✅ Includes retry logic for database connection (up to 5 retries)

**Method 2: Existing Admin Promoting Users**

Once you have an admin, they can promote existing users:

**Endpoint:** `PUT /api/users/:userId/role`

**Request Headers:**
```
Authorization: Bearer <admin-jwt-token>
```

**Request Body:**
```json
{
  "role": "admin"
}
```

**Supported Roles:**
- `user` - Regular user (default)
- `editor` - Can manage books
- `admin` - Full system access

**Restrictions:**
- Only admins can change user roles
- Admins cannot change their own role

**Using cURL:**
```bash
# Get admin token first by logging in
ADMIN_TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"AdminPass123"}' \
  | jq -r '.token')

# Promote user to admin
curl -X PUT http://localhost:5000/api/users/USER_ID_HERE/role \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "admin"}'
```

---

## 4. Login and Authentication

### Login Flow

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Success Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "John Doe",
    "role": "user",
    "phone": "+1234567890",
    "isActive": true,
    "createdAt": "2024-01-10T12:00:00.000Z"
  }
}
```

**Error Responses:**

1. **Invalid Credentials (401):**
```json
{
  "error": "Invalid email or password"
}
```

2. **Account Inactive (403):**
```json
{
  "error": "Account is inactive. Please contact support."
}
```

### Authentication Process

1. **Password Hashing:**
   - Uses bcrypt with 12 rounds (very secure)
   - Hashing happens automatically via Sequelize hooks
   - Passwords are NEVER stored in plain text
   - Passwords are NEVER returned in API responses

2. **JWT Token:**
   - Generated on successful login
   - Default expiration: 7 days (configurable via `JWT_EXPIRES_IN`)
   - Contains user ID only (no sensitive data)
   - Must be included in `Authorization` header for protected routes

3. **Using the Token:**
```bash
# Include in Authorization header for protected routes
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

### Protected Routes

**Routes requiring authentication (`authenticate` middleware):**
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password
- All `/api/loans/*` routes
- All book management routes (create/update/delete)

**Routes requiring admin role (`isAdmin` middleware):**
- All `/api/users/*` routes
- User management, role changes, etc.

**Routes requiring editor+ role:**
- `POST /api/books` - Create book
- `PUT /api/books/:id` - Update book
- `DELETE /api/books/:id` - Delete book

---

## 5. Testing the Setup

### Step 1: Verify Environment Files

```bash
# Check backend .env
cat backend/.env | grep -E "FRONTEND_URL|DB_HOST|DB_NAME"

# Expected output:
# FRONTEND_URL=http://localhost:3000
# DB_HOST=localhost
# DB_NAME=library_system

# Check frontend .env
cat frontend/.env

# Expected output:
# VITE_API_URL=http://localhost:5000/api
```

### Step 2: Verify Database Connection

```bash
# Check if PostgreSQL is running
pg_isready -h localhost -p 5432

# Should return: "localhost:5432 - accepting connections"

# Test connection with psql
psql -h localhost -U library_user -d library_system -c "SELECT version();"
```

### Step 3: Start the Backend

```bash
cd backend

# Install dependencies
npm install

# Run database migration
npm run db:migrate

# Start development server
npm run dev

# Expected output:
# ✅ Database connection established successfully.
# ✅ Database models synchronized.
# Server running on port 5000
```

### Step 4: Create Admin User

```bash
cd backend

npm run create-admin -- --email=admin@library.com --password=Admin123! --name="System Admin"

# Expected output:
# ✅ Admin user created successfully
# Email: admin@library.com
# Role: admin
```

### Step 5: Test Login

```bash
# Login as admin
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@library.com","password":"Admin123!"}' \
  | jq .

# Should return JWT token and user object
```

### Step 6: Test Registration (Regular User)

```bash
# Register new user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "fullName": "Test User",
    "phone": "+1234567890"
  }' | jq .

# Should return JWT token with role: "user"
```

---

## 6. Common Issues and Troubleshooting

### Issue: "Cannot enter FRONTEND_URL=http://localhost:3000"

**Solution:** ✅ **FIXED!** The `.env` files have been created. You can now:
1. Edit `backend/.env` directly
2. The `FRONTEND_URL` is already set to `http://localhost:3000`
3. No special syntax needed - just edit the file normally

### Issue: "Database connection refused"

**Cause:** PostgreSQL is not running

**Solutions:**
```bash
# Check if PostgreSQL is running
pg_isready -h localhost -p 5432

# Start PostgreSQL (Ubuntu/Debian)
sudo systemctl start postgresql

# Start PostgreSQL (macOS with Homebrew)
brew services start postgresql@15

# Or use Docker
docker-compose up -d
```

### Issue: "Authentication failed for user"

**Cause:** Database user doesn't exist or password is wrong

**Solution:**
```bash
# Recreate the database user
sudo -u postgres psql

CREATE USER library_user WITH PASSWORD 'library_password';
GRANT ALL PRIVILEGES ON DATABASE library_system TO library_user;
\q
```

### Issue: "Admin creation fails - user already exists"

**Cause:** Admin user already exists in database

**Solutions:**
1. **Use different email address**
2. **Login with existing admin credentials**
3. **Reset the user in database:**
   ```sql
   -- In psql
   DELETE FROM users WHERE email = 'admin@example.com';
   ```

### Issue: "Invalid token" errors

**Cause:** JWT token expired or invalid

**Solution:**
- Login again to get a new token
- Check `JWT_SECRET` is consistent (don't change it after creating tokens)
- Verify token format: `Bearer <token>`

---

## 7. Quick Reference

### Environment Variables Summary

| Variable | Location | Value | Purpose |
|----------|----------|-------|---------|
| `FRONTEND_URL` | backend/.env | `http://localhost:3000` | CORS configuration |
| `VITE_API_URL` | frontend/.env | `http://localhost:5000/api` | API endpoint |
| `DB_HOST` | backend/.env | `localhost` | Database host |
| `DB_NAME` | backend/.env | `library_system` | Database name |
| `DB_USER` | backend/.env | `library_user` | Database user |
| `DB_PASSWORD` | backend/.env | `library_password` | Database password |
| `JWT_SECRET` | backend/.env | (change in production) | JWT signing key |

### User Roles and Permissions

| Role | Create Books | Manage Loans | User Management | Created Via |
|------|--------------|--------------|-----------------|-------------|
| `user` | ❌ No | ✅ Own loans only | ❌ No | Self-registration |
| `editor` | ✅ Yes | ✅ Own loans only | ❌ No | Admin promotion |
| `admin` | ✅ Yes | ✅ All loans | ✅ Yes | Script or promotion |

### Useful Commands

```bash
# Database
npm run db:migrate              # Create/update tables
npm run create-admin            # Create admin user

# Development
npm run dev                     # Start backend server
npm test                        # Run tests

# Database check
pg_isready -h localhost -p 5432 # Check PostgreSQL status
psql -U library_user -d library_system  # Connect to database
```

---

## 8. Next Steps

1. ✅ Environment files created (`.env` files are ready)
2. ✅ `FRONTEND_URL` is properly set
3. ⏳ **TODO: Install and start PostgreSQL** (if not using Docker)
4. ⏳ **TODO: Run `npm run db:migrate`** to create tables
5. ⏳ **TODO: Create your first admin user** with `npm run create-admin`
6. ⏳ **TODO: Test login flow** with the admin credentials
7. ⏳ **TODO: Test user registration** via API
8. ⏳ **TODO: Start the frontend** and verify end-to-end flow

---

## Need Help?

- Check logs: Backend server outputs detailed error messages
- Database connection errors include troubleshooting steps
- All passwords are hashed automatically - never stored in plain text
- JWT tokens expire after 7 days by default (configurable)

For more information, see:
- `backend/src/controllers/authController.js` - Authentication logic
- `backend/src/middleware/auth.js` - Authentication middleware
- `backend/src/utils/create-admin.js` - Admin creation script
- `backend/src/config/database.js` - Database configuration
