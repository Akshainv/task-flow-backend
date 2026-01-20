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
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')
        ) {
            token = req.headers.authorization.split(' ')[1];
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

        // Check for token in Authorization header
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')
        ) {
            token = req.headers.authorization.split(' ')[1];
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

            // Check if role is manager
            if (decoded.role !== 'manager') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Manager role required.',
                });
            }

            // Attach manager to request (excluding password)
            req.user = await Manager.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Not authorized. Manager not found.',
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
        console.error('Manager Auth Middleware Error:', error);
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

        // Check for token in Authorization header
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')
        ) {
            token = req.headers.authorization.split(' ')[1];
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
