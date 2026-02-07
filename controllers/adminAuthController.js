/**
 * Admin Authentication Controller
 * Handles admin login and token generation
 */

import bcrypt from 'bcryptjs';

import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';

/**
 * @desc    Admin Login
 * @route   POST /api/admin/login
 * @access  Public
 */
export const loginAdmin = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
        return next(new AppError('Please provide email and password', 400));
    }

    // Find admin by email
    const admin = await Admin.findOne({ email: email.toLowerCase().trim() });

    // Check if admin exists
    if (!admin) {
        return next(new AppError('Invalid credentials', 401));
    }

    // Compare password using bcrypt
    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
        return next(new AppError('Invalid credentials', 401));
    }

    // Generate JWT token
    const token = jwt.sign(
        { id: admin._id, role: 'admin' },
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
});

/**
 * @desc    Get current logged-in admin profile
 * @route   GET /api/admin/profile
 * @access  Private (requires auth middleware)
 */
export const getAdminProfile = catchAsync(async (req, res, next) => {
    const admin = await Admin.findById(req.admin.id).select('-password');

    if (!admin) {
        return next(new AppError('Admin not found', 404));
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
});
