/**
 * Setup Admin in New Database
 * Creates admin account in the new MongoDB Atlas cluster
 * Usage: node scripts/setup_admin_new_db.js
 */

import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';

dotenv.config();

// Use Google DNS for SRV lookups
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const setupAdmin = async () => {
    try {
        console.log('🔗 Connecting to MongoDB Atlas cluster...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB Atlas');

        // Admin credentials
        const adminEmail = 'admin@gmail.com';
        const adminPassword = 'task123';

        // Check if admin already exists
        const existingAdmin = await mongoose.connection.db.collection('admins').findOne({ email: adminEmail });

        if (existingAdmin) {
            console.log('✅ Admin already exists in the database');
            console.log(`   Email: ${existingAdmin.email}`);
            return;
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminPassword, salt);

        // Create admin document
        const adminDoc = {
            email: adminEmail,
            password: hashedPassword,
            name: 'Admin',
            role: 'admin',
            fcmToken: '',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // Insert admin into database
        const result = await mongoose.connection.db.collection('admins').insertOne(adminDoc);

        if (result.insertedId) {
            console.log('\n✅ Admin account created successfully!');
            console.log('📧 Email: admin@gmail.com');
            console.log('🔑 Password: task123');
            console.log('\n🎉 You can now log in to your application!');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Disconnected from MongoDB');
    }
};

setupAdmin();
