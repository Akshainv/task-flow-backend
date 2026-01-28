
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

import Notification from '../models/Notification.js';

const checkNotifications = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const notifications = await Notification.find().sort({ createdAt: -1 }).limit(10);

        console.log('\n--- Recent Notifications ---');
        notifications.forEach(n => {
            console.log(`[${n.createdAt.toISOString()}] ${n.userType} (${n.userId}): ${n.title} - ${n.message}`);
        });

        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkNotifications();
