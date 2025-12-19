require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./src/config/database');
const User = require('./src/models/User');

const createAdminUser = async () => {
  try {
    // Connect to database
    await db.authenticate();
    console.log('Database connected successfully');

    // Sync models
    await db.sync();
    console.log('Database synced');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ 
      where: { email: 'admin@volunteering.com' } 
    });

    if (existingAdmin) {
      console.log('Admin user already exists!');
      console.log('Email: admin@volunteering.com');
      console.log('You can reset the password if needed.');
      process.exit(0);
    }

    // Create admin user
    const admin = await User.create({
      email: 'admin@volunteering.com',
      password: 'Admin@123', // Will be hashed automatically by the model
      firstName: 'Admin',
      lastName: 'User',
      role: 'moderator',
      phoneNumber: '1234567890',
      isActive: true,
      emailVerified: true,
      profileCompleted: true,
      consentGiven: true
    });

    console.log('\n✅ Admin user created successfully!');
    console.log('==========================================');
    console.log('Email: admin@volunteering.com');
    console.log('Password: Admin@123');
    console.log('Role: moderator');
    console.log('==========================================');
    console.log('\n⚠️  IMPORTANT: Change this password after first login!');
    console.log('\nYou can now login at: http://localhost:5173/login');
    console.log('Navigate to: http://localhost:5173/admin/charities to manage charity applications\n');

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
};

createAdminUser();
