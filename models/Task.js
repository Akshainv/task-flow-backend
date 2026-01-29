/**
 * Task Model
 * Mongoose schema for the tasks collection
 */

import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
    {
        taskName: {
            type: String,
            required: [true, 'Task name is required'],
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        assignedEmployee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Employee',
            required: [true, 'Assigned employee is required'],
        },
        status: {
            type: String,
            enum: ['Pending', 'In Progress', 'Completed'],
            default: 'Pending',
        },
        deadline: {
            type: Date,
        },
        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project',
            required: [true, 'Project is required'],
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Manager',
            required: [true, 'Creator (Manager) is required'],
        },
        // Progress updates submitted by employee (Photos & Text only)
        progressUpdates: [{
            photos: [String],
            voiceNote: String,
            notes: String,
            submittedAt: { type: Date, default: Date.now },
            approvalStatus: {
                type: String,
                enum: ['pending', 'approved', 'rejected'],
                default: 'pending'
            },
            approvalNote: String,
            approvedAt: Date
        }],
        // Latest approval request status
        pendingApproval: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true,
        collection: 'tasks',
    }
);

// Add indexes for dashboard and project optimization
taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ assignedEmployee: 1, status: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ createdBy: 1 });

const Task = mongoose.model('Task', taskSchema);

export default Task;
