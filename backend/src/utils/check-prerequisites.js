#!/usr/bin/env node
import { exec } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';
import net from 'net';

const execAsync = promisify(exec);
dotenv.config();

const checkPostgresConnection = (host, port) => {
  return new Promise((resolve) => {
    const client = net.createConnection({ host, port, timeout: 2000 }, () => {
      client.end();
      resolve(true);
    });

    client.on('error', () => {
      resolve(false);
    });

    client.on('timeout', () => {
      client.destroy();
      resolve(false);
    });
  });
};

const checkPrerequisites = async () => {
  console.log('\n🔍 Checking Prerequisites for Library Management System\n');
  console.log('='.repeat(60));

  let hasErrors = false;

  // Check Node.js version
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

  if (majorVersion >= 20) {
    console.log(`✅ Node.js version: ${nodeVersion} (OK)`);
  } else {
    console.log(`❌ Node.js version: ${nodeVersion} (Requires v20+)`);
    hasErrors = true;
  }

  // Check environment variables
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = process.env.DB_PORT || 5432;
  const databaseUrl = process.env.DATABASE_URL;

  console.log('\n📋 Configuration:');
  if (databaseUrl) {
    console.log(`   DATABASE_URL: ${databaseUrl.replace(/:[^:@]*@/, ':****@')}`);

    // Extract host from DATABASE_URL
    const match = databaseUrl.match(/@([^:]+):/);
    if (match) {
      const urlHost = match[1];
      if (urlHost === 'db' || urlHost === 'database') {
        console.log(`   ⚠️  WARNING: DATABASE_URL uses hostname '${urlHost}'`);
        console.log(`       This only works inside Docker!`);
        console.log(`       For local development, use DB_HOST=localhost instead`);
        hasErrors = true;
      }
    }
  } else {
    console.log(`   DB_HOST: ${dbHost}`);
    console.log(`   DB_PORT: ${dbPort}`);
    console.log(`   DB_NAME: ${process.env.DB_NAME || 'library_system'}`);
    console.log(`   DB_USER: ${process.env.DB_USER || 'library_user'}`);
  }

  // Check PostgreSQL connectivity
  console.log('\n🐘 PostgreSQL:');

  const targetHost = databaseUrl
    ? databaseUrl.match(/@([^:]+):/)?.[1] || dbHost
    : dbHost;
  const targetPort = parseInt(dbPort);

  const isConnected = await checkPostgresConnection(targetHost, targetPort);

  if (isConnected) {
    console.log(`   ✅ PostgreSQL is accessible at ${targetHost}:${targetPort}`);
  } else {
    console.log(`   ❌ PostgreSQL is NOT accessible at ${targetHost}:${targetPort}`);
    hasErrors = true;

    console.log('\n💡 Troubleshooting:');

    if (targetHost === 'db' || targetHost === 'database') {
      console.log('   This hostname only works inside Docker containers.');
      console.log('\n   Option 1 - Use Docker (Recommended):');
      console.log('     docker-compose up -d');
      console.log('\n   Option 2 - Update configuration for local development:');
      console.log('     1. Edit backend/.env');
      console.log('     2. Set DB_HOST=localhost');
      console.log('     3. Comment out or remove DATABASE_URL');
      console.log('     4. Ensure PostgreSQL is running locally on port 5432');
    } else {
      console.log('   1. Install PostgreSQL if not installed:');
      console.log('      - Ubuntu/Debian: sudo apt install postgresql');
      console.log('      - macOS: brew install postgresql');
      console.log('      - Windows: Download from postgresql.org');
      console.log('\n   2. Start PostgreSQL service:');
      console.log('      - Ubuntu/Debian: sudo service postgresql start');
      console.log('      - macOS: brew services start postgresql');
      console.log('      - Windows: Start from Services');
      console.log('\n   3. Create database and user:');
      console.log('      sudo -u postgres psql');
      console.log('      CREATE DATABASE library_system;');
      console.log('      CREATE USER library_user WITH PASSWORD \'library_password\';');
      console.log('      GRANT ALL PRIVILEGES ON DATABASE library_system TO library_user;');
      console.log('\n   4. Or use Docker (easier):');
      console.log('      docker-compose up -d');
    }
  }

  // Check for Docker
  console.log('\n🐳 Docker:');
  try {
    const { stdout } = await execAsync('docker --version');
    console.log(`   ✅ Docker installed: ${stdout.trim()}`);

    try {
      await execAsync('docker ps');
      console.log('   ✅ Docker daemon is running');
    } catch {
      console.log('   ⚠️  Docker is installed but daemon is not running');
      console.log('       Start Docker Desktop or run: sudo systemctl start docker');
    }
  } catch {
    console.log('   ⚠️  Docker is not installed');
    console.log('       Install from: https://docs.docker.com/get-docker/');
  }

  console.log('\n' + '='.repeat(60));

  if (hasErrors) {
    console.log('\n❌ Prerequisites check failed. Please fix the issues above.\n');
    process.exit(1);
  } else {
    console.log('\n✅ All prerequisites are satisfied!\n');
    process.exit(0);
  }
};

// Run the check
checkPrerequisites().catch((error) => {
  console.error('Error checking prerequisites:', error.message);
  process.exit(1);
});
