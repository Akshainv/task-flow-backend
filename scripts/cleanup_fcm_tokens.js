
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

const cleanupTokens = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const employees = await Employee.find({}, 'name email fcmToken');
        const managers = await Manager.find({}, 'name email fcmToken');
        const admins = await Admin.find({}, 'name email fcmToken');

        const allUsers = [...employees, ...managers, ...admins];
        const tokenMap = {};

        // Track tokens and find duplicates
        allUsers.forEach(user => {
            if (user.fcmToken && user.fcmToken !== '') {
                if (!tokenMap[user.fcmToken]) {
                    tokenMap[user.fcmToken] = [];
                }
                tokenMap[user.fcmToken].push(user);
            }
        });

        // Resolve duplicates by only keeping the last one (or clearing all if we can't be sure)
        // For existing duplicates, it's safer to clear all and let users re-register on next login/app load
        for (const token in tokenMap) {
            if (tokenMap[token].length > 1) {
                console.log(`Clearing duplicate token: ${token.substring(0, 20)}... from ${tokenMap[token].length} users`);

                await Admin.updateMany({ fcmToken: token }, { fcmToken: '' });
                await Manager.updateMany({ fcmToken: token }, { fcmToken: '' });
                await Employee.updateMany({ fcmToken: token }, { fcmToken: '' });
            }
        }

        console.log('Cleanup completed successfully.');
        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

cleanupTokens();
