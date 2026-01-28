/**
 * Notification Model
 * Mongoose schema for the notifications collection
 */

import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: [true, 'User ID is required'],
            refPath: 'userType',
        },
        userType: {
            type: String,
            enum: ['Admin', 'Manager', 'Employee'],
            required: [true, 'User type is required'],
        },
        title: {
            type: String,
            required: [true, 'Title is required'],
            trim: true,
        },
        message: {
            type: String,
            required: [true, 'Message is required'],
            trim: true,
        },
        type: {
            type: String,
            enum: [
                'task',
                'task_assigned',
                'task_updated',
                'task_completed',
                'project_created',
                'project_updated',
                'service_request',
                'service_request_updated',
                'employee_created',
                'manager_created',
                'general',
            ],
            default: 'general',
        },
        relatedId: {
            type: mongoose.Schema.Types.ObjectId,
            // Optional reference to related document (task, project, etc.)
        },
        isRead: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
        collection: 'notifications',
    }
);

// Index for faster queries
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
