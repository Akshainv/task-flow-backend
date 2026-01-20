/**
 * Employee Routes
 * Handles all employee-related endpoints
 */

import express from 'express';
import {
    createEmployee,
    getAllEmployees,
    getEmployeeById,
    updateEmployee,
    deleteEmployee,
    loginEmployee,
    getEmployeeProfile,
} from '../controllers/employeeController.js';
import { protect, protectEmployee } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route   POST /api/employees/login
 * @desc    Employee login
 * @access  Public
 */
router.post('/login', loginEmployee);

/**
 * @route   GET /api/employees/profile
 * @desc    Get current employee profile
 * @access  Private (Employee only)
 */
router.get('/profile', protectEmployee, getEmployeeProfile);

/**
 * @route   POST /api/employees
 * @desc    Create a new employee
 * @access  Private (Admin only)
 */
router.post('/', protect, createEmployee);

/**
 * @route   GET /api/employees
 * @desc    Get all employees
 * @access  Private (Admin only)
 */
router.get('/', protect, getAllEmployees);

/**
 * @route   GET /api/employees/:id
 * @desc    Get single employee by ID
 * @access  Private (Admin only)
 */
router.get('/:id', protect, getEmployeeById);

/**
 * @route   PUT /api/employees/:id
 * @desc    Update employee
 * @access  Private (Admin only)
 */
router.put('/:id', protect, updateEmployee);

/**
 * @route   DELETE /api/employees/:id
 * @desc    Delete employee
 * @access  Private (Admin only)
 */
router.delete('/:id', protect, deleteEmployee);

export default router;
