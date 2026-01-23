/**
 * Notification Routes
 * Handles all notification-related endpoints
 */

import express from 'express';
import {
    getMyNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
} from '../controllers/notificationController.js';
import { protectAny } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get unread notification count
 * @access  Private (All roles)
 */
router.get('/unread-count', protectAny, getUnreadCount);

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private (All roles)
 */
router.put('/read-all', protectAny, markAllAsRead);

/**
 * @route   GET /api/notifications
 * @desc    Get all notifications for the logged-in user
 * @access  Private (All roles)
 */
router.get('/', protectAny, getMyNotifications);

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark a notification as read
 * @access  Private (All roles)
 */
router.put('/:id/read', protectAny, markAsRead);

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete a notification
 * @access  Private (All roles)
 */
router.delete('/:id', protectAny, deleteNotification);

export default router;
