/**
 * Dashboard Routes
 * Provides statistics endpoints for all role dashboards
 */

import express from 'express';
import {
    getAdminDashboardStats,
    getManagerDashboardStats,
    getEmployeeDashboardStats,
} from '../controllers/dashboardController.js';
import { protect, protectManager, protectEmployee } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route   GET /api/dashboard/admin
 * @desc    Get admin dashboard statistics
 * @access  Private (Admin only)
 */
router.get('/admin', protect, getAdminDashboardStats);

/**
 * @route   GET /api/dashboard/manager
 * @desc    Get manager dashboard statistics
 * @access  Private (Manager only)
 */
router.get('/manager', protectManager, getManagerDashboardStats);

/**
 * @route   GET /api/dashboard/employee
 * @desc    Get employee dashboard statistics
 * @access  Private (Employee only)
 */
router.get('/employee', protectEmployee, getEmployeeDashboardStats);

export default router;
