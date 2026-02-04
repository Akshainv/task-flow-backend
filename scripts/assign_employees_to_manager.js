/**
 * Assign Employees to Manager Script
 * This script assigns all employees to all managers in the database
 * Usage: node scripts/assign_employees_to_manager.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';

dotenv.config();

// Use Google DNS for SRV lookups
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const assignEmployees = async () => {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;

        // Get all employees
        const employees = await db.collection('employees').find({}).toArray();
        console.log(`\n📋 Found ${employees.length} employees:`);
        employees.forEach(e => console.log(`   - ${e.name} (${e.email})`));

        if (employees.length === 0) {
            console.log('❌ No employees found in database');
            return;
        }

        // Get employee IDs
        const employeeIds = employees.map(e => e._id);

        // Get all managers
        const managers = await db.collection('managers').find({}).toArray();
        console.log(`\n👔 Found ${managers.length} manager(s):`);
        managers.forEach(m => console.log(`   - ${m.name} (${m.email})`));

        if (managers.length === 0) {
            console.log('❌ No managers found in database');
            return;
        }

        // Assign all employees to all managers
        const result = await db.collection('managers').updateMany(
            {},
            { $set: { employees: employeeIds } }
        );

        console.log(`\n✅ Updated ${result.modifiedCount} manager(s)`);
        console.log('✅ All employees are now assigned to the manager(s)');
        console.log('\n🎉 The manager should now see employees when creating projects!');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Disconnected from MongoDB');
    }
};

assignEmployees();
