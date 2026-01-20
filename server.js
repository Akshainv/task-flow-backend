/**
 * Task Flow Backend Server
 * Main entry point for the Admin Authentication API
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import adminAuthRoutes from './routes/adminAuthRoutes.js';
import managerRoutes from './routes/managerRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// ===== MIDDLEWARE =====

// Enable CORS for frontend integration
app.use(cors({
    origin: ['http://localhost:4200', 'http://localhost:3000'], // Angular & React defaults
    credentials: true,
}));

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// ===== ROUTES =====

// Admin Authentication Routes
app.use('/api/admin', adminAuthRoutes);

// Manager Routes
app.use('/api/managers', managerRoutes);

// Employee Routes
app.use('/api/employees', employeeRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Task Flow API is running',
        timestamp: new Date().toISOString(),
    });
});

// 404 Handler - Route not found
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
    });
});

// ===== START SERVER =====

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 API Base URL: http://localhost:${PORT}/api`);
    console.log(`🔐 Admin Login: POST http://localhost:${PORT}/api/admin/login`);
    console.log(`👔 Manager APIs: http://localhost:${PORT}/api/managers`);
    console.log(`👤 Employee APIs: http://localhost:${PORT}/api/employees`);
});