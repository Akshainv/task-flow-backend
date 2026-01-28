
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

import Task from '../models/Task.js';

const checkTaskPhotos = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const tasks = await Task.find({ 'progressUpdates.0': { $exists: true } });

        console.log(`\n--- Tasks with updates: ${tasks.length} ---`);
        tasks.forEach(t => {
            console.log(`Task: ${t.taskName} (${t._id})`);
            t.progressUpdates.forEach((u, i) => {
                console.log(`  Update ${i + 1}: Photos: ${JSON.stringify(u.photos)}, Notes: ${u.notes}`);
            });
        });

        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkTaskPhotos();
