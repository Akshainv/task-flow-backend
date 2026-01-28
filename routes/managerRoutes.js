/**
 * Manager Routes
 * Handles all manager-related endpoints
 */

import express from 'express';
import {
    createManager,
    getAllManagers,
    getManagerById,
    updateManager,
    deleteManager,
    loginManager,
    getManagerProfile,
    assignEmployees,
} from '../controllers/managerController.js';
import { protect, protectManager } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route   POST /api/managers/login
 * @desc    Manager login
 * @access  Public
 */
router.post('/login', loginManager);

/**
 * @route   GET /api/managers/profile
 * @desc    Get current manager profile
 * @access  Private (Manager only)
 */
router.get('/profile', protectManager, getManagerProfile);

/**
 * @route   POST /api/managers
 * @desc    Create a new manager
 * @access  Private (Admin only)
 */
router.post('/', protect, createManager);

/**
 * @route   GET /api/managers
 * @desc    Get all managers
 * @access  Private (Admin only)
 */
router.get('/', protect, getAllManagers);

/**
 * @route   GET /api/managers/:id
 * @desc    Get single manager by ID
 * @access  Private (Admin only)
 */
router.get('/:id', protect, getManagerById);

/**
 * @route   PUT /api/managers/:id
 * @desc    Update manager
 * @access  Private (Admin only)
 */
router.put('/:id', protect, updateManager);

/**
 * @route   DELETE /api/managers/:id
 * @desc    Delete manager
 * @access  Private (Admin only)
 */
router.delete('/:id', protect, deleteManager);

/**
 * @route   PUT /api/managers/:id/assign
 * @desc    Assign employees to a manager
 * @access  Private (Admin only)
 */
router.put('/:id/assign', protect, assignEmployees);

export default router;
