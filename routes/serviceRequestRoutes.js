/**
 * Service Request Routes
 * Handles all service request-related endpoints
 */

import express from 'express';
import {
    createServiceRequest,
    getMyServiceRequests,
    getAllServiceRequests,
    updateServiceRequest,
    deleteServiceRequest,
} from '../controllers/serviceRequestController.js';
import { protectManager, protect, protectAny } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route   GET /api/service-requests/my-requests
 * @desc    Get all service requests for the logged-in manager
 * @access  Private (Manager only)
 */
router.get('/my-requests', protectManager, getMyServiceRequests);

/**
 * @route   POST /api/service-requests
 * @desc    Create a new service request
 * @access  Private (Manager only)
 */
router.post('/', protectManager, createServiceRequest);

/**
 * @route   GET /api/service-requests
 * @desc    Get all service requests (Admin)
 * @access  Private (Admin only)
 */
router.get('/', protect, getAllServiceRequests);

/**
 * @route   PUT /api/service-requests/:id
 * @desc    Update service request status and admin response
 * @access  Private (Admin only)
 */
router.put('/:id', protect, updateServiceRequest);

/**
 * @route   DELETE /api/service-requests/:id
 * @desc    Delete service request permanently
 * @access  Private (Manager - own, Admin - any)
 */
router.delete('/:id', protectAny, deleteServiceRequest);

export default router;
