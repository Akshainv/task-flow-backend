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
    },
    {
        timestamps: true,
        collection: 'tasks',
    }
);

const Task = mongoose.model('Task', taskSchema);

export default Task;
