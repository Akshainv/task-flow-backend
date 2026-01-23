/**
 * Unified Auth Controller
 * Single login endpoint for all roles (Admin, Manager, Employee)
 * Automatically detects role based on email
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import Manager from '../models/Manager.js';
import Employee from '../models/Employee.js';

/**
 * @desc    Unified login for all roles
 * @route   POST /api/auth/login
 * @access  Public
 * 
 * Frontend sends: { email, password }
 * Backend returns: { success, token, role, user }
 */
export const unifiedLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password',
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        let user = null;
        let role = null;

        // Step 1: Check Admin collection
        // Note: Admin model uses bcrypt.compare directly (no matchPassword method)
        const admin = await Admin.findOne({ email: normalizedEmail });
        if (admin) {
            const isMatch = await bcrypt.compare(password, admin.password);
            if (isMatch) {
                user = admin;
                role = 'admin';
            }
        }

        // Step 2: If not admin, check Manager collection
        // Note: Manager model has matchPassword method
        if (!user) {
            const manager = await Manager.findOne({ email: normalizedEmail });
            if (manager) {
                const isMatch = await manager.matchPassword(password);
                if (isMatch) {
                    user = manager;
                    role = 'manager';
                }
            }
        }

        // Step 3: If not manager, check Employee collection
        // Note: Employee model has matchPassword method
        if (!user) {
            const employee = await Employee.findOne({ email: normalizedEmail });
            if (employee) {
                const isMatch = await employee.matchPassword(password);
                if (isMatch) {
                    user = employee;
                    role = 'employee';
                }
            }
        }

        // If no user found in any collection
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
            });
        }

        // Generate JWT token with user ID and role
        const token = jwt.sign(
            { id: user._id, role: role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
        );

        // Prepare user response (exclude sensitive data)
        const userResponse = {
            id: user._id,
            name: user.name || 'Admin',
            email: user.email,
        };

        // Add role-specific fields
        if (role === 'manager') {
            userResponse.company = user.company;
            userResponse.contactNumber = user.contactNumber;
        } else if (role === 'employee') {
            userResponse.contactNumber = user.contactNumber;
            userResponse.designation = user.designation;
        }

        // Send response with data object containing token, role, and user
        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                role,
                user: userResponse,
            },
        });

    } catch (error) {
        console.error('Unified Login Error:', error.message);
        console.error('Stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.',
        });
    }
};

/**
 * @desc    Get current logged-in user profile
 * @route   GET /api/auth/profile
 * @access  Private (Any authenticated user)
 */
export const getProfile = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized',
            });
        }

        const userResponse = {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role,
        };

        // Add role-specific fields
        if (req.user.role === 'manager') {
            userResponse.company = req.user.company;
            userResponse.contactNumber = req.user.contactNumber;
        } else if (req.user.role === 'employee') {
            userResponse.contactNumber = req.user.contactNumber;
            userResponse.designation = req.user.designation;
        }

        res.status(200).json({
            success: true,
            user: userResponse,
        });
    } catch (error) {
        console.error('Get Profile Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.',
        });
    }
};
