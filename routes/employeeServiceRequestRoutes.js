import express from 'express';
import {
    createEmployeeServiceRequest,
    getMyEmployeeServiceRequests,
    getReceivedEmployeeServiceRequests,
    updateEmployeeServiceRequest,
    deleteEmployeeServiceRequest
} from '../controllers/employeeServiceRequestController.js';
import { protectEmployee, protectManager, protectAny } from '../middleware/authMiddleware.js';

const router = express.Router();

// protect - generic protect (checks for some valid user)
// protectManager - specific to manager
// protectEmployee - might be needed? Let's check authMiddleware.js

// Create new request
router.post('/', protectEmployee, createEmployeeServiceRequest);

// Get employee's own requests
router.get('/', protectEmployee, getMyEmployeeServiceRequests);

// Get manager's received requests
router.get('/received', protectManager, getReceivedEmployeeServiceRequests);

// Update status
router.put('/:id', protectManager, updateEmployeeServiceRequest);

// Delete request
router.delete('/:id', protectAny, deleteEmployeeServiceRequest);

export default router;
