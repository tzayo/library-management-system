import { User } from '../models/index.js';

/**
 * Initialize default admin user if no admin exists
 * This runs automatically on server startup
 */
export const initDefaultAdmin = async () => {
  try {
    // Check if any admin user exists
    const adminExists = await User.findOne({ where: { role: 'admin' } });

    if (adminExists) {
      console.log('✓ Admin user already exists');
      return { success: true, created: false };
    }

    // Get admin credentials from environment variables
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@library.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
    const adminName = process.env.ADMIN_NAME || 'מנהל מערכת';

    // Create default admin user
    console.log('📝 No admin user found. Creating default admin...');
    const admin = await User.create({
      email: adminEmail,
      password: adminPassword,
      fullName: adminName,
      role: 'admin',
      isActive: true
    });

    console.log('✅ Default admin user created successfully!');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Password: ${adminPassword}`);
    console.log('   ⚠️  Please change the password after first login!');

    return { success: true, created: true, admin: admin.toSafeObject() };
  } catch (error) {
    console.error('❌ Error initializing default admin:', error.message);
    return { success: false, error: error.message };
  }
};
