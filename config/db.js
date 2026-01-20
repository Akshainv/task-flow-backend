/**
 * MongoDB Database Connection Configuration
 * Uses Mongoose for MongoDB object modeling
 */

import mongoose from 'mongoose';

/**
 * Connects to MongoDB using the URI from environment variables
 * @returns {Promise<void>}
 */
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;
