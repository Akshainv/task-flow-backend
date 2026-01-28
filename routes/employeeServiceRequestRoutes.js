import express from 'express';
import {
    createEmployeeServiceRequest,
    getMyEmployeeServiceRequests,
    getReceivedEmployeeServiceRequests,
    updateEmployeeServiceRequest,
    deleteEmployeeServiceRequest
} from '../controllers/employeeServiceRequestController.js';
import { protect, protectManager, protectAny } from '../middleware/authMiddleware.js';

const router = express.Router();

// protect - generic protect (checks for some valid user)
// protectManager - specific to manager
// protectEmployee - might be needed? Let's check authMiddleware.js

router.post('/', protectAny, createEmployeeServiceRequest);
router.get('/my-requests', protectAny, getMyEmployeeServiceRequests);
router.get('/received', protectManager, getReceivedEmployeeServiceRequests);
router.put('/:id', protectManager, updateEmployeeServiceRequest);
router.delete('/:id', protectAny, deleteEmployeeServiceRequest);

export default router;
