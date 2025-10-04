/**
 * Script to create test users with different roles
 * Run this to set up test users for role-based login testing
 */

import mongoose from 'mongoose';
import User from './models/User.js';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/document-management';

const testUsers = [
  {
    name: 'Admin User',
    email: 'admin@test.com',
    password: 'admin123',
    role: 'admin',
    department: 'Administration',
    employeeId: 'ADMIN001',
    isActive: true,
    isEmailVerified: true,
    is_verified: true
  },
  {
    name: 'Staff1 User',
    email: 'staff1@test.com',
    password: 'staff123',
    role: 'staff1',
    department: 'Form Review',
    employeeId: 'STAFF001',
    isActive: true,
    isEmailVerified: true,
    is_verified: true
  },
  {
    name: 'Staff2 User',
    email: 'staff2@test.com',
    password: 'staff123',
    role: 'staff2',
    department: 'Trustee Validation',
    employeeId: 'STAFF002',
    isActive: true,
    isEmailVerified: true,
    is_verified: true
  },
  {
    name: 'Staff3 User',
    email: 'staff3@test.com',
    password: 'staff123',
    role: 'staff3',
    department: 'Land Verification',
    employeeId: 'STAFF003',
    isActive: true,
    isEmailVerified: true,
    is_verified: true
  },
  {
    name: 'Staff4 User',
    email: 'staff4@test.com',
    password: 'staff123',
    role: 'staff4',
    department: 'Approval & Review',
    employeeId: 'STAFF004',
    isActive: true,
    isEmailVerified: true,
    is_verified: true
  },
  {
    name: 'Staff5 User',
    email: 'staff5@test.com',
    password: 'staff123',
    role: 'staff5',
    department: 'Final Approval',
    employeeId: 'STAFF005',
    isActive: true,
    isEmailVerified: true,
    is_verified: true
  }
];

async function createTestUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing test users
    await User.deleteMany({
      email: { $in: testUsers.map(user => user.email) }
    });
    console.log('Cleared existing test users');

    // Create test users
    for (const userData of testUsers) {
      try {
        // Hash password
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(userData.password, salt);

        // Create user
        const user = new User({
          ...userData,
          password: hashedPassword
        });

        await user.save();
        console.log(`✅ Created ${userData.role} user: ${userData.email}`);

      } catch (error) {
        console.error(`❌ Failed to create ${userData.role} user:`, error.message);
      }
    }

    console.log('\n🎉 Test users created successfully!');
    console.log('\nTest Credentials:');
    console.log('================');
    testUsers.forEach(user => {
      console.log(`${user.role.toUpperCase()}: ${user.email} / ${user.password}`);
    });

    console.log('\nExpected Redirects:');
    console.log('==================');
    testUsers.forEach(user => {
      const dashboardPath = getDashboardPath(user.role);
      console.log(`${user.role.toUpperCase()}: ${dashboardPath}`);
    });

  } catch (error) {
    console.error('Error creating test users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

function getDashboardPath(role) {
  const roleDashboardMap = {
    'admin': '/admin/dashboard',
    'staff1': '/staff1/dashboard',
    'staff2': '/staff2/dashboard',
    'staff3': '/staff3/dashboard',
    'staff4': '/staff4/dashboard',
    'staff5': '/staff5/dashboard'
  };

  return roleDashboardMap[role] || '/admin/login';
}

// Run the script
createTestUsers();
