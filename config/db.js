/**
 * MongoDB Database Connection Configuration
 * Uses Mongoose for MongoDB object modeling
 */

import mongoose from 'mongoose';
import dns from 'dns';

// Configure Node.js to use Google DNS for SRV lookups
// This fixes "querySrv ECONNREFUSED" errors on restrictive networks
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

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
