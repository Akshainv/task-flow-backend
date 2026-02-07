/**
 * Script to update plainPassword field for all existing employees and managers
 * Run this script once after adding the plainPassword field to populate it
 * 
 * Usage: node scripts/update_plain_passwords.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Employee from '../models/Employee.js';
import Manager from '../models/Manager.js';

dotenv.config();

const DEFAULT_PASSWORD = 'password123';

async function updatePlainPasswords() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Update all employees without plainPassword
        const employees = await Employee.find({
            $or: [
                { plainPassword: { $exists: false } },
                { plainPassword: '' },
                { plainPassword: null }
            ]
        });

        console.log(`Found ${employees.length} employees without plainPassword`);

        for (const employee of employees) {
            employee.password = DEFAULT_PASSWORD;
            await employee.save();
            console.log(`Updated employee: ${employee.name} - Password set to: ${DEFAULT_PASSWORD}`);
        }

        // Update all managers without plainPassword
        const managers = await Manager.find({
            $or: [
                { plainPassword: { $exists: false } },
                { plainPassword: '' },
                { plainPassword: null }
            ]
        });

        console.log(`Found ${managers.length} managers without plainPassword`);

        for (const manager of managers) {
            manager.password = DEFAULT_PASSWORD;
            await manager.save();
            console.log(`Updated manager: ${manager.name} - Password set to: ${DEFAULT_PASSWORD}`);
        }

        console.log('\n=== Update Complete ===');
        console.log(`All existing employees and managers now have password: ${DEFAULT_PASSWORD}`);
        console.log('They can login with this password and change it later.');

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
        process.exit(0);

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

updatePlainPasswords();
