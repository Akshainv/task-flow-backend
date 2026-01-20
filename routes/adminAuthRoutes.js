/**
 * Admin Authentication Routes
 * Handles all admin auth-related endpoints
 */

import express from 'express';
import { loginAdmin, getAdminProfile } from '../controllers/adminAuthController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route   POST /api/admin/login
 * @desc    Admin login
 * @access  Public
 */
router.post('/login', loginAdmin);

/**
 * @route   GET /api/admin/profile
 * @desc    Get current admin profile
 * @access  Private
 */
router.get('/profile', protect, getAdminProfile);

export default router;
