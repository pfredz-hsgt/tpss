/**
 * Alternative JavaScript version for creating admin user
 * Run with: node scripts/create-admin.js
 * 
 * Note: This version uses bcryptjs which doesn't require compilation
 */

const { PrismaClient } = require('../src/generated/prisma/client');
const bcrypt = require('bcrypt');
require('dotenv').config();

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

async function createAdminUser() {
  try {
    const username = 'admin';
    const password = 'admin';
    const fullName = 'Administrator';
    const role = 'ADMIN';

    // Check if admin user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      console.log('Admin user already exists!');
      console.log('Username:', existingUser.username);
      console.log('Role:', existingUser.role);
      return;
    }

    // Hash the password
    console.log('Hashing password...');
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create the admin user
    console.log('Creating admin user...');
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        fullName,
        role,
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        createdAt: true,
      },
    });

    console.log('\n✅ Admin user created successfully!');
    console.log('================================');
    console.log('Username:', user.username);
    console.log('Full Name:', user.fullName);
    console.log('Role:', user.role);
    console.log('ID:', user.id);
    console.log('Created At:', user.createdAt);
    console.log('\nYou can now login with:');
    console.log('  Username: admin');
    console.log('  Password: admin');
    console.log('================================\n');
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createAdminUser();

