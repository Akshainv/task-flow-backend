/**
 * Unified Auth Routes
 * Single login endpoint for all roles
 */

import express from 'express';
import { unifiedLogin, getProfile, registerFCMToken } from '../controllers/authController.js';
import { protectAny } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route   POST /api/auth/login
 * @desc    Unified login for Admin, Manager, or Employee
 * @access  Public
 * 
 * Request:  { email, password }
 * Response: { success, token, role, user }
 */
router.post('/login', unifiedLogin);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile (any role)
 * @access  Private (Any authenticated user)
 */
router.get('/profile', protectAny, getProfile);

/**
 * @route   POST /api/auth/fcm-token
 * @desc    Register FCM token for any role
 * @access  Private (Any authenticated user)
 */
router.post('/fcm-token', protectAny, registerFCMToken);

export default router;
