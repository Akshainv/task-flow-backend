/**
 * Manager Controller
 * Handles CRUD operations and authentication for managers
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Manager from '../models/Manager.js';

/**
 * @desc    Create new manager
 * @route   POST /api/managers
 * @access  Private (Admin only)
 */
export const createManager = async (req, res) => {
    try {
        const { name, email, password, company, contactNumber } = req.body;
        console.log('BODY:', req.body);

        // Validate required fields
        if (!name || !email || !password || !company || !contactNumber) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields',
            });
        }

        

        // Check if manager already exists
        const existingManager = await Manager.findOne({ email: email.toLowerCase().trim() });
        if (existingManager) {
            return res.status(400).json({
                success: false,
                message: 'Manager with this email already exists',
            });
        }

        // Create manager (password will be hashed by pre-save middleware)
        const manager = await Manager.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password,
            company: company.trim(),
            contactNumber: contactNumber.trim(),
        });

        res.status(201).json({
            success: true,
            message: 'Manager created successfully',
            manager: {
                id: manager._id,
                name: manager.name,
                email: manager.email,
                company: manager.company,
                contactNumber: manager.contactNumber,
                role: manager.role,
            },
        });
    } catch (error) {
        console.error('Create Manager Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.',
        });
    }
};

/**
 * @desc    Get all managers
 * @route   GET /api/managers
 * @access  Private (Admin only)
 */
export const getAllManagers = async (req, res) => {
    try {
        const managers = await Manager.find().select('-password').sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: managers.length,
            managers,
        });
    } catch (error) {
        console.error('Get Managers Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.',
        });
    }
};

/**
 * @desc    Get single manager by ID
 * @route   GET /api/managers/:id
 * @access  Private (Admin only)
 */
export const getManagerById = async (req, res) => {
    try {
        const manager = await Manager.findById(req.params.id).select('-password');

        if (!manager) {
            return res.status(404).json({
                success: false,
                message: 'Manager not found',
            });
        }

        res.status(200).json({
            success: true,
            manager,
        });
    } catch (error) {
        console.error('Get Manager Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.',
        });
    }
};

/**
 * @desc    Update manager
 * @route   PUT /api/managers/:id
 * @access  Private (Admin only)
 */
export const updateManager = async (req, res) => {
    try {
        const { name, email, password, company, contactNumber } = req.body;

        const manager = await Manager.findById(req.params.id);

        if (!manager) {
            return res.status(404).json({
                success: false,
                message: 'Manager not found',
            });
        }

        // Check if new email already exists (excluding current manager)
        if (email && email.toLowerCase().trim() !== manager.email) {
            const existingManager = await Manager.findOne({ email: email.toLowerCase().trim() });
            if (existingManager) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already in use',
                });
            }
        }

        // Update fields
        if (name) manager.name = name.trim();
        if (email) manager.email = email.toLowerCase().trim();
        if (company) manager.company = company.trim();
        if (contactNumber) manager.contactNumber = contactNumber.trim();
        if (password) manager.password = password; // Will be hashed by pre-save middleware

        await manager.save();

        res.status(200).json({
            success: true,
            message: 'Manager updated successfully',
            manager: {
                id: manager._id,
                name: manager.name,
                email: manager.email,
                company: manager.company,
                contactNumber: manager.contactNumber,
                role: manager.role,
            },
        });
    } catch (error) {
        console.error('Update Manager Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.',
        });
    }
};

/**
 * @desc    Delete manager
 * @route   DELETE /api/managers/:id
 * @access  Private (Admin only)
 */
export const deleteManager = async (req, res) => {
    try {
        const manager = await Manager.findById(req.params.id);

        if (!manager) {
            return res.status(404).json({
                success: false,
                message: 'Manager not found',
            });
        }

        await Manager.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Manager deleted successfully',
        });
    } catch (error) {
        console.error('Delete Manager Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.',
        });
    }
};

/**
 * @desc    Manager Login
 * @route   POST /api/managers/login
 * @access  Public
 */
export const loginManager = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password',
            });
        }

        // Find manager by email
        const manager = await Manager.findOne({ email: email.toLowerCase().trim() });

        if (!manager) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
        }

        // Compare password
        const isPasswordValid = await manager.matchPassword(password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: manager._id, role: 'manager' },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
        );

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            manager: {
                id: manager._id,
                name: manager.name,
                email: manager.email,
                company: manager.company,
                contactNumber: manager.contactNumber,
                role: manager.role,
            },
        });
    } catch (error) {
        console.error('Manager Login Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.',
        });
    }
};

/**
 * @desc    Get current logged-in manager profile
 * @route   GET /api/managers/profile
 * @access  Private (Manager only)
 */
export const getManagerProfile = async (req, res) => {
    try {
        const manager = await Manager.findById(req.user.id).select('-password');

        if (!manager) {
            return res.status(404).json({
                success: false,
                message: 'Manager not found',
            });
        }

        res.status(200).json({
            success: true,
            manager,
        });
    } catch (error) {
        console.error('Get Profile Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.',
        });
    }
};
