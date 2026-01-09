import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Database configuration
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'library_system',
  username: process.env.DB_USER || 'library_user',
  password: process.env.DB_PASSWORD || 'library_password',
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};

// Initialize Sequelize
const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: config.pool
    })
  : new Sequelize(config.database, config.username, config.password, {
      host: config.host,
      port: config.port,
      dialect: config.dialect,
      logging: config.logging,
      pool: config.pool
    });

// Test database connection
export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Sync models in development (creates tables if they don't exist)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: false });
      console.log('✅ Database models synchronized.');
    }

    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error.message);

    // Provide helpful error messages based on the error type
    if (error.message.includes('ENOTFOUND')) {
      const hostname = error.message.match(/ENOTFOUND (.+)/)?.[1];
      console.error('\n💡 Troubleshooting:');
      console.error(`   The hostname "${hostname}" cannot be resolved.`);

      if (hostname === 'db' || hostname === 'database') {
        console.error('   This hostname only works inside Docker containers.\n');
        console.error('   Solution 1 - Use Docker (Recommended):');
        console.error('     docker-compose up -d\n');
        console.error('   Solution 2 - Update configuration for local development:');
        console.error('     1. Edit backend/.env');
        console.error('     2. Set DB_HOST=localhost (or remove DATABASE_URL)');
        console.error('     3. Ensure PostgreSQL is running locally');
      } else {
        console.error('   Ensure the database host is correct and accessible.\n');
      }
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error('\n💡 Troubleshooting:');
      console.error('   The database server is not running or refusing connections.');
      console.error('   - Check if PostgreSQL is running');
      console.error('   - Verify the port number is correct');
      console.error('   - Or use Docker: docker-compose up -d\n');
    } else if (error.message.includes('authentication failed')) {
      console.error('\n💡 Troubleshooting:');
      console.error('   Database authentication failed.');
      console.error('   - Check DB_USER and DB_PASSWORD in .env');
      console.error('   - Verify the user exists in PostgreSQL\n');
    }

    return false;
  }
};

export default sequelize;
