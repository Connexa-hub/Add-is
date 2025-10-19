
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const email = process.env.ADMIN_EMAIL || 'admin@example.com';
    const password = process.env.ADMIN_PASSWORD || 'Admin123!';
    const name = process.env.ADMIN_NAME || 'Admin User';

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      console.log('Admin user already exists with email:', email);
      
      // Update to admin role and verify email if not already
      let updated = false;
      if (existingAdmin.role !== 'admin') {
        existingAdmin.role = 'admin';
        updated = true;
        console.log('Updated existing user to admin role');
      }
      if (!existingAdmin.emailVerified) {
        existingAdmin.emailVerified = true;
        existingAdmin.verificationOTP = undefined;
        existingAdmin.verificationExpires = undefined;
        updated = true;
        console.log('Verified admin email');
      }
      if (updated) {
        await existingAdmin.save();
      }
      console.log('✅ Admin account is ready');
      console.log('Email:', email);
      console.log('Password: Admin123! (default)');
      
      mongoose.connection.close();
      return;
    }

    // Create new admin user
    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'admin',
      isActive: true,
      emailVerified: true
    });

    console.log('✅ Admin user created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('⚠️  Please change the password after first login');

    mongoose.connection.close();
  } catch (error) {
    console.error('Error creating admin:', error);
    mongoose.connection.close();
  }
}

createAdmin();
