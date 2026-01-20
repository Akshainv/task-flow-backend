/**
 * Reset Admin Password Script
 * Run this to update admin password in database
 * Usage: node resetAdminPassword.js
 */

import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const resetPassword = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // First, let's see what admins exist
        const admins = await mongoose.connection.db.collection('admins').find({}).toArray();
        console.log('\n📋 Found admins in database:');
        admins.forEach(admin => {
            console.log(`   - Email: "${admin.email}" | ID: ${admin._id}`);
        });

        if (admins.length === 0) {
            console.log('\n❌ No admins found in database!');
            return;
        }

        // New password
        const newPassword = 'task123';

        // Hash the password with bcrypt
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        console.log('\n🔐 New hashed password:', hashedPassword);

        // Update ALL admins (or use specific _id from above)
        const result = await mongoose.connection.db.collection('admins').updateMany(
            {}, // Update all admins
            { $set: { password: hashedPassword } }
        );

        if (result.modifiedCount > 0) {
            console.log(`\n✅ Password updated for ${result.modifiedCount} admin(s)!`);
            console.log('📧 Email: admin@gmail.com (or any email shown above)');
            console.log('🔑 Password: task123');
        } else {
            console.log('\n⚠️ No passwords were updated');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Disconnected from MongoDB\n');
    }
};

resetPassword();