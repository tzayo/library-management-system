# Development Environment Setup

This guide explains how to set up the development environment for the Library Management System.

## Option 1: Docker PostgreSQL (Recommended)

This is the recommended approach for development as it isolates the database from your system.

### Prerequisites
- Docker and Docker Compose installed
- Node.js 20+
- Git

### Setup Steps

1. **Start PostgreSQL with Docker:**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

2. **Verify PostgreSQL is running:**
   ```bash
   docker ps
   # You should see library_db_dev container running
   ```

3. **Set up backend:**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env if needed (default values work with Docker setup)
   npm install
   npm run db:migrate
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **The backend will be available at:**
   - API: http://localhost:5000/api
   - Health: http://localhost:5000/health

### Managing Docker PostgreSQL

```bash
# Start PostgreSQL
docker-compose -f docker-compose.dev.yml up -d

# Stop PostgreSQL
docker-compose -f docker-compose.dev.yml down

# Stop and remove all data
docker-compose -f docker-compose.dev.yml down -v

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Access PostgreSQL CLI
docker exec -it library_db_dev psql -U library_user -d library_system
```

## Option 2: Local PostgreSQL

If you prefer to use a locally installed PostgreSQL:

### Prerequisites
- PostgreSQL 15+ installed and running
- Node.js 20+
- Git

### Setup Steps

1. **Create database and user:**
   ```bash
   sudo -u postgres psql
   ```

   Then in PostgreSQL:
   ```sql
   CREATE DATABASE library_system;
   CREATE USER library_user WITH PASSWORD 'library_password';
   GRANT ALL PRIVILEGES ON DATABASE library_system TO library_user;
   \q
   ```

2. **Set up backend:**
   ```bash
   cd backend
   cp .env.example .env
   # Ensure DB_HOST=localhost in .env
   npm install
   npm run db:migrate
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

## Environment Variables

The backend `.env` file contains:

```env
# Database Configuration
DB_HOST=localhost          # Use 'localhost' for Docker or local PostgreSQL
DB_PORT=5432
DB_NAME=library_system
DB_USER=library_user
DB_PASSWORD=library_password

# Server Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# JWT Secret (generate a secure one for production)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Email (optional for development)
EMAIL_ENABLED=false
```

## Troubleshooting

### PostgreSQL Connection Issues

If you get `ECONNREFUSED` errors:

1. **With Docker:** Make sure the container is running:
   ```bash
   docker ps
   docker-compose -f docker-compose.dev.yml up -d
   ```

2. **With local PostgreSQL:** Make sure PostgreSQL is running:
   ```bash
   sudo service postgresql status
   sudo service postgresql start
   ```

### Port Already in Use

If port 5432 is already in use:

1. Stop any running PostgreSQL:
   ```bash
   sudo service postgresql stop
   ```

2. Or modify `docker-compose.dev.yml` to use a different port:
   ```yaml
   ports:
     - "5433:5432"  # Use port 5433 on host
   ```

   Then update `DB_PORT=5433` in `.env`

## Development Workflow

1. **Start development:**
   ```bash
   # Terminal 1: Start PostgreSQL (if using Docker)
   docker-compose -f docker-compose.dev.yml up

   # Terminal 2: Start backend
   cd backend && npm run dev

   # Terminal 3: Start frontend
   cd frontend && npm run dev
   ```

2. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api
   - Health Check: http://localhost:5000/health

3. **Default admin credentials:**
   - Email: admin@library.com
   - Password: Admin123!
