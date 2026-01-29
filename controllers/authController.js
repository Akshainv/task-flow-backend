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
        const { email, password, role: requestedRole } = req.body;

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

        // Step 1: Check requested role and search in corresponding collection
        if (!requestedRole) {
            // Fallback for backward compatibility or if role not provided
            // Step 1: Check Admin collection
            const admin = await Admin.findOne({ email: normalizedEmail });
            if (admin) {
                const isMatch = await bcrypt.compare(password, admin.password);
                if (isMatch) {
                    user = admin;
                    role = 'admin';
                }
            }

            // Step 2: If not admin, check Manager collection
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
        } else {
            // Enforce role-wise login
            if (requestedRole === 'admin') {
                const admin = await Admin.findOne({ email: normalizedEmail });
                if (admin) {
                    const isMatch = await bcrypt.compare(password, admin.password);
                    if (isMatch) {
                        user = admin;
                        role = 'admin';
                    }
                }
            } else if (requestedRole === 'manager') {
                const manager = await Manager.findOne({ email: normalizedEmail });
                if (manager) {
                    const isMatch = await manager.matchPassword(password);
                    if (isMatch) {
                        user = manager;
                        role = 'manager';
                    }
                }
            } else if (requestedRole === 'employee') {
                const employee = await Employee.findOne({ email: normalizedEmail });
                if (employee) {
                    const isMatch = await employee.matchPassword(password);
                    if (isMatch) {
                        user = employee;
                        role = 'employee';
                    }
                }
            }
        }

        // If no user found or password didn't match
        if (!user) {
            return res.status(401).json({
                success: false,
                message: requestedRole
                    ? `Invalid ${requestedRole} credentials`
                    : 'Invalid email or password',
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

/**
 * @desc    Register FCM token for current user
 * @route   POST /api/auth/fcm-token
 * @access  Private
 */
export const registerFCMToken = async (req, res) => {
    try {
        const { fcmToken } = req.body;
        const email = req.user?.email;
        console.log(`[FCM] Registration request from ${email}. Token: ${fcmToken ? fcmToken.substring(0, 10) + '...' : 'MISSING'}`);

        if (!fcmToken) {
            return res.status(400).json({
                success: false,
                message: 'FCM Token is required',
            });
        }

        const role = req.user.role;
        const userId = req.user._id;

        // Ensure token uniqueness: Remove this token from any other user (Admin, Manager, or Employee)
        // This handles cases where multiple users log in on the same device/browser
        await Promise.all([
            Admin.updateMany({ fcmToken }, { fcmToken: '' }),
            Manager.updateMany({ fcmToken }, { fcmToken: '' }),
            Employee.updateMany({ fcmToken }, { fcmToken: '' })
        ]);

        let user;
        if (role === 'admin') {
            user = await Admin.findByIdAndUpdate(userId, { fcmToken }, { new: true });
        } else if (role === 'manager') {
            user = await Manager.findByIdAndUpdate(userId, { fcmToken }, { new: true });
        } else if (role === 'employee') {
            user = await Employee.findByIdAndUpdate(userId, { fcmToken }, { new: true });
        }

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'FCM Token registered successfully',
        });
    } catch (error) {
        console.error('Register FCM Token Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.',
        });
    }
};
