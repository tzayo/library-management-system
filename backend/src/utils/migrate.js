import dotenv from 'dotenv';
import sequelize from '../config/database.js';
import { User, Book, Loan } from '../models/index.js';

dotenv.config();

const migrate = async () => {
  try {
    console.log('\n===========================================');
    console.log('📦 Database Migration');
    console.log('===========================================\n');

    console.log('📡 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.\n');

    console.log('🔨 Creating/updating database tables...');
    console.log('   - Users table');
    console.log('   - Books table');
    console.log('   - Loans table\n');

    // Sync all models
    // force: false means don't drop existing tables
    // alter: true means alter tables to match models
    await sequelize.sync({ force: false, alter: true });

    console.log('✅ Database tables created/updated successfully!\n');
    console.log('===========================================');
    console.log('🎉 Migration completed successfully');
    console.log('===========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nDetails:', error);
    console.log('');
    process.exit(1);
  }
};

// Run migration
migrate();
