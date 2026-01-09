# 🗄️ Database Guide

This guide explains how to inspect, manage, and troubleshoot the PostgreSQL database.

## 📋 Table of Contents

- [Viewing Database Contents](#viewing-database-contents)
- [Database Location](#database-location)
- [Common Database Operations](#common-database-operations)
- [Backup and Restore](#backup-and-restore)
- [Troubleshooting](#troubleshooting)

---

## Viewing Database Contents

### Using Docker

If you're running with Docker, you can access the database directly:

```bash
# Connect to PostgreSQL shell
docker-compose exec db psql -U library_user -d library_system

# Or single command queries
docker-compose exec db psql -U library_user -d library_system -c "SELECT * FROM users;"
```

### Using psql (Local Installation)

If PostgreSQL is installed locally:

```bash
# Connect to database
psql -h localhost -U library_user -d library_system

# You'll be prompted for password (default: library_password)
```

### Common SQL Queries

Once connected to the database:

```sql
-- List all tables
\dt

-- View table structure
\d users
\d books
\d loans

-- View all users
SELECT id, email, "fullName", role, "isActive", "createdAt" FROM users;

-- View all books
SELECT id, title, author, category, quantity, available FROM books;

-- View active loans
SELECT
    l.id,
    u."fullName" as borrower,
    b.title as book,
    l."borrowDate",
    l."dueDate",
    l."returnDate",
    l.status
FROM loans l
JOIN users u ON l."userId" = u.id
JOIN books b ON l."bookId" = b.id
WHERE l.status = 'active';

-- Count users by role
SELECT role, COUNT(*) FROM users GROUP BY role;

-- Check admin users
SELECT id, email, "fullName", role FROM users WHERE role = 'admin';

-- Exit psql
\q
```

---

## Database Location

### Docker Setup

The database data is stored in a **Docker volume**:

```bash
# List Docker volumes
docker volume ls | grep library

# Inspect volume
docker volume inspect library-management-system_postgres_data

# Volume location (usually)
# Linux: /var/lib/docker/volumes/library-management-system_postgres_data/_data
# macOS: ~/Library/Containers/com.docker.docker/Data/vms/0/
# Windows: \\wsl$\docker-desktop-data\version-pack-data\community\docker\volumes\
```

**Important:** Docker volumes are managed by Docker and are **automatically excluded from git** (not in the project directory).

### Local PostgreSQL Setup

For local PostgreSQL installation, data location depends on your OS:

```bash
# Find PostgreSQL data directory
psql -U postgres -c "SHOW data_directory;"

# Common locations:
# Ubuntu/Debian: /var/lib/postgresql/15/main/
# macOS (Homebrew): /usr/local/var/postgresql@15/
# Windows: C:\Program Files\PostgreSQL\15\data\
```

---

## Git Ignore Configuration

The `.gitignore` file already excludes:

```gitignore
# Environment variables (contains DB credentials)
.env
.env.local
.env.production

# Local database files (SQLite, if ever used)
*.sqlite
*.db

# Docker override files
docker-compose.override.yml
```

**Note:** Docker volumes are NOT in the git repository directory, so they don't need to be explicitly ignored.

### What IS tracked in git:

- ✅ `docker-compose.yml` - Database configuration (without passwords)
- ✅ `.env.example` - Template with example values
- ✅ Migration scripts
- ✅ Database models (code)

### What is NOT tracked:

- ❌ `.env` - Contains actual passwords
- ❌ Docker volumes - Database data
- ❌ `node_modules/` - Dependencies

---

## Common Database Operations

### Reset Database (Delete All Data)

**Using Docker:**
```bash
# Stop services and remove volumes
docker-compose down -v

# Start fresh
docker-compose up -d

# Create new admin
docker-compose exec backend npm run create-admin -- --email=admin@example.com --password=Admin123
```

**Using Local PostgreSQL:**
```bash
# Drop and recreate database
sudo -u postgres psql -c "DROP DATABASE library_system;"
sudo -u postgres psql -c "CREATE DATABASE library_system;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE library_system TO library_user;"

# Restart backend (it will recreate tables)
cd backend
npm run dev
```

### Create Additional Admin User

```bash
# Using Docker
docker-compose exec backend npm run create-admin -- \
  --email=admin@example.com \
  --password=SecurePass123 \
  --name="Admin Name"

# Without Docker
cd backend
npm run create-admin -- \
  --email=admin@example.com \
  --password=SecurePass123 \
  --name="Admin Name"
```

### Check If Admin Exists

```bash
# Using Docker
docker-compose exec db psql -U library_user -d library_system -c \
  "SELECT email, \"fullName\", role FROM users WHERE role='admin';"

# Local PostgreSQL
psql -h localhost -U library_user -d library_system -c \
  "SELECT email, \"fullName\", role FROM users WHERE role='admin';"
```

### Update User Role

Connect to the database and run:

```sql
-- Make user an admin
UPDATE users SET role = 'admin' WHERE email = 'user@example.com';

-- Make user an editor
UPDATE users SET role = 'editor' WHERE email = 'user@example.com';

-- Activate/deactivate user
UPDATE users SET "isActive" = true WHERE email = 'user@example.com';
UPDATE users SET "isActive" = false WHERE email = 'user@example.com';
```

---

## Backup and Restore

### Backup Database

**Using Docker:**
```bash
# Create backup file
docker-compose exec db pg_dump -U library_user library_system > backup.sql

# Or with timestamp
docker-compose exec db pg_dump -U library_user library_system > backup_$(date +%Y%m%d_%H%M%S).sql
```

**Using Local PostgreSQL:**
```bash
pg_dump -h localhost -U library_user library_system > backup.sql
```

### Restore Database

**Using Docker:**
```bash
# Stop backend first
docker-compose stop backend

# Restore
cat backup.sql | docker-compose exec -T db psql -U library_user -d library_system

# Restart
docker-compose start backend
```

**Using Local PostgreSQL:**
```bash
psql -h localhost -U library_user -d library_system < backup.sql
```

---

## Troubleshooting

### Can't see any data in database

1. **Check if database exists:**
   ```bash
   # Docker
   docker-compose exec db psql -U library_user -l

   # Local
   psql -h localhost -U postgres -l | grep library_system
   ```

2. **Check if tables exist:**
   ```bash
   # Docker
   docker-compose exec db psql -U library_user -d library_system -c "\dt"

   # Local
   psql -h localhost -U library_user -d library_system -c "\dt"
   ```

3. **If no tables, restart backend** (it will create them):
   ```bash
   # Docker
   docker-compose restart backend
   docker-compose logs -f backend

   # Local
   cd backend && npm run dev
   ```

### Connection refused when accessing database

```bash
# Check if PostgreSQL is running
# Docker
docker-compose ps

# Local
sudo service postgresql status  # Linux
brew services list | grep postgres  # macOS
```

### Permission denied errors

```bash
# Grant all privileges (connect to postgres as superuser)
sudo -u postgres psql
```
```sql
GRANT ALL PRIVILEGES ON DATABASE library_system TO library_user;
GRANT ALL ON SCHEMA public TO library_user;
\q
```

### View database size

```sql
SELECT
    pg_size_pretty(pg_database_size('library_system')) as database_size;
```

### Clear all data but keep tables

```sql
-- Delete all loans
DELETE FROM loans;

-- Delete all books
DELETE FROM books;

-- Delete all users except admins
DELETE FROM users WHERE role != 'admin';

-- Or delete all users
DELETE FROM users;
```

---

## Quick Reference

```bash
# View everything quickly
./check-connectivity.sh

# Check prerequisites
cd backend && npm run check

# Connect to database
docker-compose exec db psql -U library_user -d library_system

# View all users
docker-compose exec db psql -U library_user -d library_system -c "SELECT * FROM users;"

# Create admin
docker-compose exec backend npm run create-admin -- --email=admin@test.com --password=Admin123

# Reset everything
docker-compose down -v && docker-compose up -d
```

---

**Last Updated:** 2026-01-09
