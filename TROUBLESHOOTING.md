# 🔧 Troubleshooting Guide

This guide helps you resolve common issues when setting up and running the Library Management System.

## Table of Contents

- [Database Connection Issues](#database-connection-issues)
- [Docker Issues](#docker-issues)
- [Running Without Docker](#running-without-docker)
- [Port Conflicts](#port-conflicts)
- [Common Errors](#common-errors)

## Quick Diagnostics

Before troubleshooting, run the prerequisites check:

```bash
cd backend
npm run check
```

This will identify most configuration and connectivity issues automatically.

---

## Database Connection Issues

### Error: `getaddrinfo ENOTFOUND db`

**Symptom:** Application fails to connect with error message mentioning hostname "db" not found.

**Cause:** The application is configured to connect to a Docker container hostname, but is running outside Docker.

**Solutions:**

#### Option 1: Use Docker (Recommended)

```bash
# Start all services
docker-compose up -d

# Verify services are running
docker-compose ps

# Check logs
docker-compose logs -f
```

#### Option 2: Configure for Local Development

1. Edit `backend/.env`:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=library_system
   DB_USER=library_user
   DB_PASSWORD=library_password
   ```

2. Comment out or remove `DATABASE_URL` if present:
   ```env
   # DATABASE_URL=postgres://...
   ```

3. Ensure PostgreSQL is running locally (see [Installing PostgreSQL](#installing-postgresql-locally))

### Error: `ECONNREFUSED`

**Symptom:** Connection refused when trying to connect to the database.

**Cause:** PostgreSQL is not running or not accepting connections on the specified port.

**Solutions:**

1. **Check if PostgreSQL is running:**
   ```bash
   # Ubuntu/Debian
   sudo service postgresql status

   # macOS
   brew services list | grep postgresql

   # Using netcat
   nc -zv localhost 5432
   ```

2. **Start PostgreSQL:**
   ```bash
   # Ubuntu/Debian
   sudo service postgresql start

   # macOS
   brew services start postgresql

   # Windows
   # Start from Services (services.msc)
   ```

3. **Or use Docker instead:**
   ```bash
   docker-compose up -d db
   ```

### Error: `authentication failed for user`

**Symptom:** Database credentials are rejected.

**Cause:** Username or password in `.env` doesn't match PostgreSQL user.

**Solutions:**

1. **Verify credentials in `backend/.env`:**
   ```env
   DB_USER=library_user
   DB_PASSWORD=library_password
   ```

2. **Create/update PostgreSQL user:**
   ```bash
   sudo -u postgres psql
   ```
   ```sql
   -- Create user if doesn't exist
   CREATE USER library_user WITH PASSWORD 'library_password';

   -- Or update password
   ALTER USER library_user WITH PASSWORD 'library_password';

   -- Grant privileges
   GRANT ALL PRIVILEGES ON DATABASE library_system TO library_user;
   ```

---

## Docker Issues

### Docker is not installed

**Install Docker:**

- **Ubuntu/Debian:**
  ```bash
  curl -fsSL https://get.docker.com -o get-docker.sh
  sudo sh get-docker.sh
  sudo usermod -aG docker $USER
  ```

- **macOS:** Download [Docker Desktop](https://www.docker.com/products/docker-desktop/)

- **Windows:** Download [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### Docker daemon is not running

**Start Docker:**

- **Ubuntu/Debian:**
  ```bash
  sudo systemctl start docker
  sudo systemctl enable docker
  ```

- **macOS/Windows:** Start Docker Desktop application

### Containers fail to start

1. **Check container logs:**
   ```bash
   docker-compose logs db
   docker-compose logs backend
   docker-compose logs frontend
   ```

2. **Restart services:**
   ```bash
   docker-compose down
   docker-compose up -d
   ```

3. **Rebuild containers:**
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```

4. **Check for port conflicts** (see [Port Conflicts](#port-conflicts))

---

## Running Without Docker

If you prefer to run the application directly without Docker:

### Installing PostgreSQL Locally

#### Ubuntu/Debian

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### macOS

```bash
brew install postgresql@15
brew services start postgresql@15
```

#### Windows

Download and install from [postgresql.org](https://www.postgresql.org/download/windows/)

### Setting Up the Database

```bash
# Switch to postgres user
sudo -u postgres psql

# Or on Windows/macOS
psql -U postgres
```

```sql
-- Create database
CREATE DATABASE library_system;

-- Create user
CREATE USER library_user WITH PASSWORD 'library_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE library_system TO library_user;

-- Connect to the database
\c library_system

-- Grant schema privileges (PostgreSQL 15+)
GRANT ALL ON SCHEMA public TO library_user;

-- Exit
\q
```

### Configure Environment

1. **Create `backend/.env`:**
   ```bash
   cd backend
   cp .env.example .env
   ```

2. **Edit `backend/.env`:**
   ```env
   NODE_ENV=development
   PORT=5000
   FRONTEND_URL=http://localhost:3000

   # Database - Use localhost for local PostgreSQL
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=library_system
   DB_USER=library_user
   DB_PASSWORD=library_password

   # JWT Secret (generate a secure one!)
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=7d

   # Email (optional for development)
   EMAIL_ENABLED=false
   ```

3. **Install dependencies and run:**
   ```bash
   npm install
   npm run dev
   ```

---

## Port Conflicts

### Port 5432 (PostgreSQL) already in use

**Find what's using the port:**
```bash
# Linux/macOS
sudo lsof -i :5432

# Windows
netstat -ano | findstr :5432
```

**Solutions:**
- Stop the conflicting service
- Change the port in `docker-compose.yml` and `backend/.env`:
  ```yaml
  # docker-compose.yml
  ports:
    - "5433:5432"  # Changed from 5432:5432
  ```
  ```env
  # backend/.env
  DB_PORT=5433
  ```

### Port 5000 (Backend) already in use

**Solutions:**
- Stop the conflicting service
- Change the port in `docker-compose.yml` and `backend/.env`:
  ```yaml
  # docker-compose.yml
  ports:
    - "5001:5000"
  ```
  ```env
  # backend/.env
  PORT=5000  # Keep as 5000 (internal port)
  ```
  ```env
  # frontend/.env
  VITE_API_URL=http://localhost:5001/api  # Changed port
  ```

### Port 3000 (Frontend) already in use

**Solutions:**
- Stop the conflicting service
- Change the port in `docker-compose.yml`:
  ```yaml
  # docker-compose.yml
  frontend:
    ports:
      - "3001:3000"
  ```

---

## Common Errors

### Error: "Cannot find module"

**Solution:**
```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Error: "No admin users found"

**Create an admin user:**

```bash
# Using Docker
docker-compose exec backend npm run create-admin -- --email=admin@library.com --password=Admin123! --name="Admin"

# Without Docker
cd backend
npm run create-admin -- --email=admin@library.com --password=Admin123! --name="Admin"
```

### Frontend cannot connect to backend

1. **Check backend is running:**
   ```bash
   curl http://localhost:5000/health
   ```

2. **Verify `frontend/.env`:**
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

3. **Check CORS settings** in `backend/.env`:
   ```env
   FRONTEND_URL=http://localhost:3000
   ```

### Database tables not created

**Run migration:**
```bash
# Using Docker
docker-compose exec backend npm run db:migrate

# Without Docker
cd backend
npm run db:migrate
```

---

## Additional Resources

### Useful Commands

```bash
# Check prerequisites
cd backend && npm run check

# View all Docker logs
docker-compose logs -f

# View specific service logs
docker logs library_backend -f
docker logs library_db -f

# Restart a specific service
docker-compose restart backend

# Stop all services
docker-compose down

# Stop and remove all data
docker-compose down -v

# Check connectivity (from project root)
./check-connectivity.sh
```

### Getting Help

If none of these solutions work:

1. Run the diagnostics: `cd backend && npm run check`
2. Check the logs: `docker-compose logs -f` (if using Docker)
3. Verify your configuration matches the examples above
4. Check if firewalls are blocking the ports
5. Open an issue on GitHub with:
   - Output of `npm run check`
   - Relevant error messages
   - Your operating system
   - Whether using Docker or local setup

---

**Last Updated:** 2026-01-09
