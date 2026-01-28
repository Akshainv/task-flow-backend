import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const nuclearDrop = async () => {
    try {
        console.log('Connecting to:', process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const collection = mongoose.connection.collection('attendances');
        console.log('Dropping ALL indexes for attendances...');
        await collection.dropIndexes();
        console.log('Successfully dropped all custom indexes.');

        const indexesPost = await collection.indexes();
        console.log('Remaining indexes:', JSON.stringify(indexesPost, null, 2));

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

nuclearDrop();
