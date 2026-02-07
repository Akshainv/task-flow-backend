/**
 * Employee Controller
 * Handles CRUD operations and authentication for employees
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Employee from '../models/Employee.js';
import Manager from '../models/Manager.js';
import { getPaginationParams, getPaginationMeta } from '../utils/pagination.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';

/**
 * @desc    Create new employee
 * @route   POST /api/employees
 * @access  Private (Admin only)
 */
export const createEmployee = catchAsync(async (req, res, next) => {
    const { name, email, password, contactNumber, designation } = req.body;

    // Validate required fields
    if (!name || !email || !password || !contactNumber || !designation) {
        return next(new AppError('Please provide all required fields', 400));
    }

    // Check if employee already exists
    const existingEmployee = await Employee.findOne({ email: email.toLowerCase().trim() });
    if (existingEmployee) {
        return next(new AppError('Employee with this email already exists', 400));
    }

    // Create employee (password will be hashed by pre-save middleware)
    const employee = await Employee.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password,
        contactNumber: contactNumber.trim(),
        designation: designation.trim()
    });

    res.status(201).json({
        success: true,
        message: 'Employee created successfully',
        employee: {
            id: employee._id,
            name: employee.name,
            email: employee.email,
            contactNumber: employee.contactNumber,
            designation: employee.designation,
            role: employee.role
        },
    });
});

/**
 * @desc    Get all employees
 * @route   GET /api/employees
 * @access  Private (Admin and Manager)
 */
export const getAllEmployees = catchAsync(async (req, res, next) => {
    const { page, limit, skip } = getPaginationParams(req.query);
    let query = {};

    // If requester is a manager, only show employees assigned to them
    if (req.user && req.user.role === 'manager') {
        const manager = await Manager.findById(req.user._id);
        if (manager && manager.employees && manager.employees.length > 0) {
            query._id = { $in: manager.employees };
        } else {
            return res.status(200).json({
                success: true,
                count: 0,
                employees: [],
                pagination: getPaginationMeta(page, limit, 0),
            });
        }
    }

    const totalCount = await Employee.countDocuments(query);
    const employees = await Employee.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    // Lazy migration: Update employees missing plainPassword
    const employeesToUpdate = employees.filter(emp => !emp.plainPassword || emp.plainPassword === '');
    if (employeesToUpdate.length > 0) {
        for (const emp of employeesToUpdate) {
            emp.password = '123456';
            await emp.save();
        }
        // Re-fetch to get updated values
        const updatedEmployees = await Employee.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        return res.status(200).json({
            success: true,
            count: updatedEmployees.length,
            employees: updatedEmployees.map(e => e.toObject()),
            pagination: getPaginationMeta(page, limit, totalCount),
        });
    }

    res.status(200).json({
        success: true,
        count: employees.length,
        employees,
        pagination: getPaginationMeta(page, limit, totalCount),
    });
});

/**
 * @desc    Get single employee by ID
 * @route   GET /api/employees/:id
 * @access  Private (Admin only)
 */
export const getEmployeeById = async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id).select('-password');

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found',
            });
        }

        res.status(200).json({
            success: true,
            employee,
        });
    } catch (error) {
        console.error('Get Employee Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.',
        });
    }
};

/**
 * @desc    Update employee
 * @route   PUT /api/employees/:id
 * @access  Private (Admin only)
 */
export const updateEmployee = async (req, res) => {
    try {
        const { name, email, password, contactNumber, designation } = req.body;

        const employee = await Employee.findById(req.params.id);

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found',
            });
        }

        // Check if new email already exists (excluding current employee)
        if (email && email.toLowerCase().trim() !== employee.email) {
            const existingEmployee = await Employee.findOne({ email: email.toLowerCase().trim() });
            if (existingEmployee) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already in use',
                });
            }
        }

        // Update fields
        if (name) employee.name = name.trim();
        if (email) employee.email = email.toLowerCase().trim();
        if (contactNumber) employee.contactNumber = contactNumber.trim();
        if (designation) employee.designation = designation.trim();
        if (password) employee.password = password; // Will be hashed by pre-save middleware

        await employee.save();

        res.status(200).json({
            success: true,
            message: 'Employee updated successfully',
            employee: {
                id: employee._id,
                name: employee.name,
                email: employee.email,
                contactNumber: employee.contactNumber,
                designation: employee.designation,
                role: employee.role
            },
        });
    } catch (error) {
        console.error('Update Employee Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.',
        });
    }
};

/**
 * @desc    Delete employee
 * @route   DELETE /api/employees/:id
 * @access  Private (Admin only)
 */
export const deleteEmployee = async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found',
            });
        }

        await Employee.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Employee deleted successfully',
        });
    } catch (error) {
        console.error('Delete Employee Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.',
        });
    }
};

/**
 * @desc    Employee Login
 * @route   POST /api/employees/login
 * @access  Public
 */
export const loginEmployee = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password',
            });
        }

        // Find employee by email
        const employee = await Employee.findOne({ email: email.toLowerCase().trim() });

        if (!employee) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
        }

        // Compare password
        const isPasswordValid = await employee.matchPassword(password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: employee._id, role: 'employee' },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
        );

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            employee: {
                id: employee._id,
                name: employee.name,
                email: employee.email,
                contactNumber: employee.contactNumber,
                designation: employee.designation,
                role: employee.role,
            },
        });
    } catch (error) {
        console.error('Employee Login Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.',
        });
    }
};

/**
 * @desc    Get current logged-in employee profile
 * @route   GET /api/employees/profile
 * @access  Private (Employee only)
 */
export const getEmployeeProfile = async (req, res) => {
    try {
        const employee = await Employee.findById(req.user.id).select('-password');

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found',
            });
        }

        res.status(200).json({
            success: true,
            employee,
        });
    } catch (error) {
        console.error('Get Profile Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.',
        });
    }
};
