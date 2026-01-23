/**
 * Notification Controller
 * Handles CRUD operations for notifications
 */

import mongoose from 'mongoose';
import Notification from '../models/Notification.js';

/**
 * Helper function to get user type from role
 */
const getUserType = (role) => {
    if (role === 'admin' || !role) return 'Admin';
    if (role === 'manager') return 'Manager';
    if (role === 'employee') return 'Employee';
    return 'Admin';
};

/**
 * @desc    Get all notifications for the logged-in user
 * @route   GET /api/notifications
 * @access  Private (All roles)
 */
export const getMyNotifications = async (req, res) => {
    try {
        const userId = req.user._id;
        const userType = getUserType(req.user.role);

        const notifications = await Notification.find({ userId, userType })
            .sort({ createdAt: -1 })
            .limit(50);

        res.status(200).json({
            success: true,
            count: notifications.length,
            notifications,
        });
    } catch (error) {
        console.error('Get Notifications Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.',
        });
    }
};

/**
 * @desc    Get unread notification count
 * @route   GET /api/notifications/unread-count
 * @access  Private (All roles)
 */
export const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user._id;
        const userType = getUserType(req.user.role);

        const count = await Notification.countDocuments({
            userId,
            userType,
            isRead: false,
        });

        res.status(200).json({
            success: true,
            unreadCount: count,
        });
    } catch (error) {
        console.error('Get Unread Count Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.',
        });
    }
};

/**
 * @desc    Mark a notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private (All roles)
 */
export const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const userType = getUserType(req.user.role);

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid notification ID',
            });
        }

        const notification = await Notification.findOneAndUpdate(
            { _id: id, userId, userType },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Notification marked as read',
            notification,
        });
    } catch (error) {
        console.error('Mark As Read Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.',
        });
    }
};

/**
 * @desc    Mark all notifications as read
 * @route   PUT /api/notifications/read-all
 * @access  Private (All roles)
 */
export const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user._id;
        const userType = getUserType(req.user.role);

        await Notification.updateMany(
            { userId, userType, isRead: false },
            { isRead: true }
        );

        res.status(200).json({
            success: true,
            message: 'All notifications marked as read',
        });
    } catch (error) {
        console.error('Mark All As Read Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.',
        });
    }
};

/**
 * @desc    Create a notification (internal helper - not exposed as route)
 * @param   {Object} data - { userId, userType, title, message, type, relatedId }
 */
export const createNotification = async (data) => {
    try {
        const notification = await Notification.create({
            userId: data.userId,
            userType: data.userType,
            title: data.title,
            message: data.message,
            type: data.type || 'general',
            relatedId: data.relatedId || null,
        });
        return notification;
    } catch (error) {
        console.error('Create Notification Error:', error.message);
        return null;
    }
};

/**
 * @desc    Delete a notification
 * @route   DELETE /api/notifications/:id
 * @access  Private (All roles)
 */
export const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const userType = getUserType(req.user.role);

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid notification ID',
            });
        }

        const notification = await Notification.findOneAndDelete({
            _id: id,
            userId,
            userType,
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Notification deleted',
        });
    } catch (error) {
        console.error('Delete Notification Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.',
        });
    }
};
