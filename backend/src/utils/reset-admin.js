import dotenv from 'dotenv';
import { User } from '../models/index.js';
import { connectDB } from '../config/database.js';

dotenv.config();

// Function to wait for a specified duration
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Function to retry database connection with exponential backoff
const connectWithRetry = async (maxRetries = 5, baseDelay = 2000) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📡 Connecting to database (attempt ${attempt}/${maxRetries})...`);
      const connected = await connectDB();

      if (connected) {
        return true;
      }

      lastError = new Error('Connection returned false');
    } catch (error) {
      lastError = error;
    }

    if (attempt < maxRetries) {
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(`⏳ Database not ready. Retrying in ${delay/1000} seconds...`);
      await sleep(delay);
    }
  }

  console.error('❌ Failed to connect to database after multiple attempts');
  if (lastError) {
    console.error(`   Last error: ${lastError.message}`);
  }
  return false;
};

// Parse command line arguments
const args = process.argv.slice(2);
const getArgValue = (argName) => {
  const arg = args.find(a => a.startsWith(`--${argName}=`));
  return arg ? arg.split('=')[1] : null;
};

const email = getArgValue('email') || 'admin@library.com';
const password = getArgValue('password');

const resetAdmin = async () => {
  try {
    console.log('\n===========================================');
    console.log('🔧 Resetting Admin User Password');
    console.log('===========================================\n');

    // Validate required fields
    if (!password) {
      console.error('❌ Error: Password is required\n');
      console.log('Usage:');
      console.log('  npm run reset-admin -- --password=SecurePass123 --email=admin@library.com\n');
      console.log('Required:');
      console.log('  --password   New password (min 8 characters)\n');
      console.log('Optional:');
      console.log('  --email      Email address (default: admin@library.com)\n');
      process.exit(1);
    }

    // Validate password strength
    if (password.length < 8) {
      console.error('❌ Error: Password must be at least 8 characters long\n');
      process.exit(1);
    }

    if (!/\d/.test(password)) {
      console.error('❌ Error: Password must contain at least one digit\n');
      process.exit(1);
    }

    // Connect to database with retry logic
    const connected = await connectWithRetry();

    if (!connected) {
      console.error('❌ Unable to connect to database. Please ensure:');
      console.error('   1. The database container is running: docker-compose ps');
      console.error('   2. Database environment variables are correctly set');
      console.error('   3. You are running this from inside Docker or the database is accessible\n');
      process.exit(1);
    }

    // Find user
    console.log(`🔍 Looking for user with email "${email}"...`);
    const user = await User.findOne({ where: { email } });

    if (!user) {
      console.error(`❌ User with email "${email}" not found\n`);
      console.log('Create a new admin user with:');
      console.log(`  npm run create-admin -- --email=${email} --password=${password} --name="Admin Name"\n`);
      process.exit(1);
    }

    // Update user
    console.log('✏️  Updating admin user...');
    user.password = password;
    user.role = 'admin';
    user.isActive = true;
    await user.save();

    console.log('\n✅ Admin user updated successfully!\n');
    console.log('Details:');
    console.log(`  ID:        ${user.id}`);
    console.log(`  Email:     ${user.email}`);
    console.log(`  Name:      ${user.fullName}`);
    console.log(`  Phone:     ${user.phone || 'N/A'}`);
    console.log(`  Role:      ${user.role}`);
    console.log(`  Active:    ${user.isActive}`);
    console.log(`  Updated:   ${user.updatedAt}`);
    console.log('\n===========================================');
    console.log('🎉 Done! You can now login with these credentials');
    console.log('===========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error resetting admin user:', error.message);

    if (error.name === 'SequelizeValidationError') {
      console.error('\nValidation errors:');
      error.errors.forEach(err => {
        console.error(`  - ${err.path}: ${err.message}`);
      });
    }

    console.log('');
    process.exit(1);
  }
};

// Run the script
resetAdmin();
