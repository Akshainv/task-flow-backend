import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const inspect = async () => {
    try {
        console.log('Connecting to:', process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const collection = mongoose.connection.collection('attendances');
        const indexes = await collection.indexes();
        console.log('--- Current Attendance Indexes ---');
        console.log(JSON.stringify(indexes, null, 2));

        console.log('\n--- Dropping employeeId_1_date_1 if unique ---');
        const target = indexes.find(i => i.name === 'employeeId_1_date_1');
        if (target && target.unique) {
            await collection.dropIndex('employeeId_1_date_1');
            console.log('Successfully dropped UNIQUE index.');
        } else if (target) {
            console.log('Index exists but is NOT unique. No action needed for uniqueness.');
        } else {
            console.log('Index employeeId_1_date_1 does not exist.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

inspect();
