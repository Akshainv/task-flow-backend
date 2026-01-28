
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

import Employee from '../models/Employee.js';
import Manager from '../models/Manager.js';
import Admin from '../models/Admin.js';

const checkTokens = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const employees = await Employee.find({}, 'name email fcmToken');
        const managers = await Manager.find({}, 'name email fcmToken');
        const admins = await Admin.find({}, 'name email fcmToken');

        console.log('\n--- Employees ---');
        employees.forEach(e => console.log(`${e.name} (${e.email}): ${e.fcmToken || 'NO TOKEN'}`));

        console.log('\n--- Managers ---');
        managers.forEach(m => console.log(`${m.name} (${m.email}): ${m.fcmToken || 'NO TOKEN'}`));

        console.log('\n--- Admins ---');
        admins.forEach(a => console.log(`${a.name} (${a.email}): ${a.fcmToken || 'NO TOKEN'}`));

        // Check for duplicates
        const allTokens = [...employees, ...managers, ...admins]
            .map(u => u.fcmToken)
            .filter(t => t && t !== '');

        const counts = {};
        allTokens.forEach(t => counts[t] = (counts[t] || 0) + 1);

        const duplicates = Object.keys(counts).filter(t => counts[t] > 1);

        if (duplicates.length > 0) {
            console.log('\n--- DUPLICATE TOKENS FOUND ---');
            duplicates.forEach(t => {
                const users = [...employees, ...managers, ...admins].filter(u => u.fcmToken === t);
                console.log(`Token: ${t.substring(0, 20)}... shared by:`);
                users.forEach(u => console.log(`  - ${u.name} (${u.email})`));
            });
        } else {
            console.log('\nNo duplicate fcmTokens found.');
        }

        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkTokens();
