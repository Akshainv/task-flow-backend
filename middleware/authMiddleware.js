/**
 * Authentication Middleware
 * Protects routes by verifying JWT tokens
 * Supports multiple roles: Admin, Manager, Employee
 */

import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import Manager from '../models/Manager.js';
import Employee from '../models/Employee.js';

/**
 * Middleware to protect admin routes
 * Verifies JWT from Authorization header (Bearer token)
 * Attaches admin data to req.admin
 */
export const protect = async (req, res, next) => {
    try {
        let token;

        // Check for token in Authorization header
        if (req.headers.authorization) {
            if (req.headers.authorization.startsWith('Bearer ')) {
                // Case 1: "Bearer <token>"
                token = req.headers.authorization.split(' ')[1];
            } else {
                // Case 2: "<token>" (no Bearer)
                token = req.headers.authorization;
            }
        }

        // Check if token exists
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized. No token provided.',
            });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Attach admin to request (excluding password)
            req.admin = await Admin.findById(decoded.id).select('-password');

            if (!req.admin) {
                return res.status(401).json({
                    success: false,
                    message: 'Not authorized. Admin not found.',
                });
            }

            next();
        } catch (jwtError) {
            // Handle specific JWT errors
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token expired. Please login again.',
                });
            }

            if (jwtError.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid token. Please login again.',
                });
            }

            throw jwtError;
        }
    } catch (error) {
        console.error('Auth Middleware Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during authentication.',
        });
    }
};

/**
 * Middleware to protect manager routes
 * Verifies JWT from Authorization header (Bearer token)
 * Attaches manager data to req.user
 */
export const protectManager = async (req, res, next) => {
    try {
        let token;

        // ===== DEBUG LOGGING START =====
        console.log('\n========== [protectManager] DEBUG ==========');
        console.log('[1] Request URL:', req.originalUrl);
        console.log('[2] Request Method:', req.method);
        console.log('[3] All Headers:', JSON.stringify(req.headers, null, 2));
        console.log('[4] Authorization header:', req.headers.authorization);
        // ===== DEBUG LOGGING END =====

        // Check for token in Authorization header
        // Supports both "Bearer <token>" and "<token>" formats
        if (req.headers.authorization) {
            if (req.headers.authorization.startsWith('Bearer ')) {
                // Case 1: "Bearer <token>"
                token = req.headers.authorization.split(' ')[1];
                console.log('[5] Token extracted: YES (Bearer format)');
            } else {
                // Case 2: "<token>" (no Bearer prefix)
                token = req.headers.authorization;
                console.log('[5] Token extracted: YES (raw token format)');
            }
            console.log('[6] Token value (first 20 chars):', token?.substring(0, 20) + '...');
        } else {
            console.log('[5] Token extracted: NO');
            console.log('[6] REASON: Authorization header is missing');
        }

        // Check if token exists
        if (!token) {
            console.log('[7] RESULT: 401 - No token provided');
            console.log('==========================================\n');
            return res.status(401).json({
                success: false,
                message: 'Not authorized. No token provided.',
            });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('[7] Token verified successfully');
            console.log('[8] Decoded payload:', JSON.stringify(decoded));

            // Check if role is manager
            if (decoded.role !== 'manager') {
                console.log('[9] RESULT: 403 - Role is not manager, got:', decoded.role);
                console.log('==========================================\n');
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Manager role required.',
                });
            }
            console.log('[9] Role check passed: manager');

            // Attach manager to request (excluding password)
            req.user = await Manager.findById(decoded.id).select('-password');

            if (!req.user) {
                console.log('[10] RESULT: 401 - Manager not found in database for id:', decoded.id);
                console.log('==========================================\n');
                return res.status(401).json({
                    success: false,
                    message: 'Not authorized. Manager not found.',
                });
            }

            console.log('[10] Manager found:', req.user.name);
            console.log('[11] RESULT: SUCCESS - Proceeding to controller');
            console.log('==========================================\n');
            next();
        } catch (jwtError) {
            console.log('[7] JWT Error:', jwtError.name, '-', jwtError.message);
            // Handle specific JWT errors
            if (jwtError.name === 'TokenExpiredError') {
                console.log('[8] RESULT: 401 - Token expired');
                console.log('==========================================\n');
                return res.status(401).json({
                    success: false,
                    message: 'Token expired. Please login again.',
                });
            }

            if (jwtError.name === 'JsonWebTokenError') {
                console.log('[8] RESULT: 401 - Invalid token');
                console.log('==========================================\n');
                return res.status(401).json({
                    success: false,
                    message: 'Invalid token. Please login again.',
                });
            }

            throw jwtError;
        }
    } catch (error) {
        console.error('Manager Auth Middleware Error:', error);
        console.log('==========================================\n');
        res.status(500).json({
            success: false,
            message: 'Server error during authentication.',
        });
    }
};

/**
 * Middleware to protect employee routes
 * Verifies JWT from Authorization header (Bearer token)
 * Attaches employee data to req.user
 */
export const protectEmployee = async (req, res, next) => {
    try {
        let token;

        // Check for token in Authorization header (supports both Bearer and raw token)
        if (req.headers.authorization) {
            if (req.headers.authorization.startsWith('Bearer ')) {
                token = req.headers.authorization.split(' ')[1];
            } else {
                token = req.headers.authorization;
            }
        }

        // Check if token exists
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized. No token provided.',
            });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Check if role is employee
            if (decoded.role !== 'employee') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Employee role required.',
                });
            }

            // Attach employee to request (excluding password)
            req.user = await Employee.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Not authorized. Employee not found.',
                });
            }

            next();
        } catch (jwtError) {
            // Handle specific JWT errors
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token expired. Please login again.',
                });
            }

            if (jwtError.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid token. Please login again.',
                });
            }

            throw jwtError;
        }
    } catch (error) {
        console.error('Employee Auth Middleware Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during authentication.',
        });
    }
};

export default protect;

/**
 * Middleware to protect routes accessible by Manager or Employee
 * Verifies JWT from Authorization header (Bearer token)
 * Attaches user data to req.user with role info
 */
export const protectManagerOrEmployee = async (req, res, next) => {
    try {
        let token;

        // Check for token in Authorization header (supports both Bearer and raw token)
        if (req.headers.authorization) {
            if (req.headers.authorization.startsWith('Bearer ')) {
                token = req.headers.authorization.split(' ')[1];
            } else {
                token = req.headers.authorization;
            }
        }

        // Check if token exists
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized. No token provided.',
            });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Check if role is manager or employee
            if (decoded.role === 'manager') {
                req.user = await Manager.findById(decoded.id).select('-password');
                if (!req.user) {
                    return res.status(401).json({
                        success: false,
                        message: 'Not authorized. Manager not found.',
                    });
                }
                req.user.role = 'manager';
            } else if (decoded.role === 'employee') {
                req.user = await Employee.findById(decoded.id).select('-password');
                if (!req.user) {
                    return res.status(401).json({
                        success: false,
                        message: 'Not authorized. Employee not found.',
                    });
                }
                req.user.role = 'employee';
            } else {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Manager or Employee role required.',
                });
            }

            next();
        } catch (jwtError) {
            // Handle specific JWT errors
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token expired. Please login again.',
                });
            }

            if (jwtError.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid token. Please login again.',
                });
            }

            throw jwtError;
        }
    } catch (error) {
        console.error('Manager/Employee Auth Middleware Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during authentication.',
        });
    }
};

/**
 * Middleware to protect routes accessible by any role (Admin, Manager, or Employee)
 * Verifies JWT from Authorization header (Bearer token)
 * Attaches user data to req.user with role info
 */
export const protectAny = async (req, res, next) => {
    try {
        let token;

        // Check for token in Authorization header (supports both Bearer and raw token)
        if (req.headers.authorization) {
            if (req.headers.authorization.startsWith('Bearer ')) {
                token = req.headers.authorization.split(' ')[1];
            } else {
                token = req.headers.authorization;
            }
        }

        // Check if token exists
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized. No token provided.',
            });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Check role and fetch appropriate user
            if (decoded.role === 'admin' || !decoded.role) {
                // Admin tokens may not have a role field
                req.user = await Admin.findById(decoded.id).select('-password');
                if (req.user) {
                    req.user.role = 'admin';
                }
            }

            if (!req.user && decoded.role === 'manager') {
                req.user = await Manager.findById(decoded.id).select('-password');
                if (req.user) {
                    req.user.role = 'manager';
                }
            }

            if (!req.user && decoded.role === 'employee') {
                req.user = await Employee.findById(decoded.id).select('-password');
                if (req.user) {
                    req.user.role = 'employee';
                }
            }

            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Not authorized. User not found.',
                });
            }

            next();
        } catch (jwtError) {
            // Handle specific JWT errors
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token expired. Please login again.',
                });
            }

            if (jwtError.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid token. Please login again.',
                });
            }

            throw jwtError;
        }
    } catch (error) {
        console.error('Any Role Auth Middleware Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during authentication.',
        });
    }
};
