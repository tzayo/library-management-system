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

const email = getArgValue('email');
const password = getArgValue('password');
const fullName = getArgValue('name') || 'מנהל מערכת';
const phone = getArgValue('phone');

const createAdmin = async () => {
  try {
    console.log('\n===========================================');
    console.log('🔧 Creating Admin User');
    console.log('===========================================\n');

    // Validate required fields
    if (!email || !password) {
      console.error('❌ Error: Email and password are required\n');
      console.log('Usage:');
      console.log('  npm run create-admin -- --email=admin@example.com --password=SecurePass123 --name="Admin Name" --phone="050-1234567"\n');
      console.log('Required:');
      console.log('  --email      Email address');
      console.log('  --password   Password (min 8 characters)\n');
      console.log('Optional:');
      console.log('  --name       Full name (default: "מנהל מערכת")');
      console.log('  --phone      Phone number\n');
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

    // Check if user already exists
    console.log(`🔍 Checking if user with email "${email}" exists...`);
    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
      console.error(`❌ User with email "${email}" already exists\n`);
      console.log('If you want to make this user an admin, use:');
      console.log(`  UPDATE users SET role = 'admin' WHERE email = '${email}';\n`);
      process.exit(1);
    }

    // Create admin user
    console.log('✏️  Creating admin user...');
    const admin = await User.create({
      email,
      password,
      fullName,
      phone,
      role: 'admin',
      isActive: true
    });

    console.log('\n✅ Admin user created successfully!\n');
    console.log('Details:');
    console.log(`  ID:        ${admin.id}`);
    console.log(`  Email:     ${admin.email}`);
    console.log(`  Name:      ${admin.fullName}`);
    console.log(`  Phone:     ${admin.phone || 'N/A'}`);
    console.log(`  Role:      ${admin.role}`);
    console.log(`  Active:    ${admin.isActive}`);
    console.log(`  Created:   ${admin.createdAt}`);
    console.log('\n===========================================');
    console.log('🎉 Done! You can now login with these credentials');
    console.log('===========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error creating admin user:', error.message);

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
createAdmin();
