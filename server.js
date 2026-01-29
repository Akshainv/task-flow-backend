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
import teamRoutes from './routes/teamRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import employeeServiceRequestRoutes from './routes/employeeServiceRequestRoutes.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// ===== MIDDLEWARE =====

// ✅ FIXED CORS CONFIG (Render + Vercel safe)
const allowedOrigins = [
  'http://localhost:4200',
  'http://localhost:3000',
  'https://task-management-infynix.vercel.app'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory with proper MIME types for audio/video
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.webm')) {
      res.setHeader('Content-Type', 'audio/webm');
    } else if (filePath.endsWith('.ogg')) {
      res.setHeader('Content-Type', 'audio/ogg');
    } else if (filePath.endsWith('.mp3')) {
      res.setHeader('Content-Type', 'audio/mpeg');
    } else if (filePath.endsWith('.wav')) {
      res.setHeader('Content-Type', 'audio/wav');
    }
  }
}));

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

// Unified Auth Routes
app.use('/api/auth', authRoutes);

// Admin Routes
app.use('/api/admin', adminAuthRoutes);

// Manager Routes
app.use('/api/managers', managerRoutes);

// Employee Routes
app.use('/api/employees', employeeRoutes);

// Attendance Routes
app.use('/api/attendance', attendanceRoutes);

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

// Employee Service Request Routes
app.use('/api/employee-service-requests', employeeServiceRequestRoutes);

// Team Routes
app.use('/api/teams', teamRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Task Flow API is running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// 404 Handler
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

const BASE_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://task-flow-backend-1.onrender.com'
    : `http://localhost:${PORT}`;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📍 API Base URL: ${BASE_URL}/api`);
});
