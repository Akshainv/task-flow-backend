/**
 * Task Flow Backend Server
 * Main entry point for the API
 * Production-ready for Render deployment
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import adminAuthRoutes from './routes/adminAuthRoutes.js';
import managerRoutes from './routes/managerRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import authRoutes from './routes/authRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import serviceRequestRoutes from './routes/serviceRequestRoutes.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// ===== MIDDLEWARE =====

// Enable CORS for all origins in production
const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? true // Allow all origins in production (or specify your frontend URL)
        : ['http://localhost:4200', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// ===== ROUTES =====

// Root endpoint
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Task Flow API Server',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            auth: '/api/auth',
            admin: '/api/admin',
            managers: '/api/managers',
            employees: '/api/employees',
            projects: '/api/projects',
            tasks: '/api/tasks',
        },
    });
});

// Unified Auth Routes (Single Login for All Roles)
app.use('/api/auth', authRoutes);

// Admin Authentication Routes (legacy - still works)
app.use('/api/admin', adminAuthRoutes);

// Manager Routes
app.use('/api/managers', managerRoutes);

// Employee Routes
app.use('/api/employees', employeeRoutes);

// Project Routes
app.use('/api/projects', projectRoutes);

// Task Routes
app.use('/api/tasks', taskRoutes);

// Notification Routes
app.use('/api/notifications', notificationRoutes);

// Dashboard Routes
app.use('/api/dashboard', dashboardRoutes);

// Service Request Routes
app.use('/api/service-requests', serviceRequestRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Task Flow API is running',
        environment: process.env.NODE_ENV || 'development',
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

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📍 API Base URL: http://localhost:${PORT}/api`);
});