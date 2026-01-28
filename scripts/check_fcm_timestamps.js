
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

import Employee from '../models/Employee.js';

const checkTimestamps = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const employees = await Employee.find({ fcmToken: { $ne: '' } }, 'name email updatedAt fcmToken');

        console.log('\n--- Employees with Tokens ---');
        employees.forEach(e => {
            console.log(`${e.name} (${e.email}): Updated At: ${e.updatedAt.toISOString()}`);
        });

        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkTimestamps();
