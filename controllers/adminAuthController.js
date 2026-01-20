/**
 * Admin Authentication Controller
 * Handles admin login and token generation
 */

import bcrypt from 'bcryptjs';

import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

/**
 * @desc    Admin Login
 * @route   POST /api/admin/login
 * @access  Public
 */
export const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password',
            });
        }

        // Find admin by email
        const admin = await Admin.findOne({ email: email.toLowerCase().trim() });

        // Check if admin exists
        if (!admin) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
        }

        // Compare password using bcrypt
        const isPasswordValid = await bcrypt.compare(password, admin.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: admin._id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
        );

        // Return success response with token and admin details
        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            admin: {
                id: admin._id,
                email: admin.email,
                name: admin.name || 'Admin',
                role: admin.role || 'admin',
            },
        });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.',
        });
    }
};

/**
 * @desc    Get current logged-in admin profile
 * @route   GET /api/admin/profile
 * @access  Private (requires auth middleware)
 */
export const getAdminProfile = async (req, res) => {
    try {
        const admin = await Admin.findById(req.admin.id).select('-password');

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found',
            });
        }

        res.status(200).json({
            success: true,
            admin: {
                id: admin._id,
                email: admin.email,
                name: admin.name || 'Admin',
                role: admin.role || 'admin',
            },
        });
    } catch (error) {
        console.error('Profile Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.',
        });
    }
};
