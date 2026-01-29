/**
 * Project Model
 * Mongoose schema for the projects collection
 */

import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
    {
        projectName: {
            type: String,
            required: [true, 'Project name is required'],
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        clientName: {
            type: String,
            trim: true,
        },
        clientPhone: {
            type: String,
            trim: true,
        },
        location: {
            type: String,
            trim: true,
        },
        assignedEmployees: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Employee',
        }],
        deadline: {
            type: Date,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Manager',
            required: [true, 'Creator (Manager) is required'],
        },
        status: {
            type: String,
            enum: ['Pending', 'Ongoing', 'Completed'],
            default: 'Pending',
        },
        progress: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        }
    },
    {
        timestamps: true,
        collection: 'projects',
    }
);

// Add indexes for dashboard optimization
projectSchema.index({ createdBy: 1, status: 1 });
projectSchema.index({ status: 1 });

const Project = mongoose.model('Project', projectSchema);

export default Project;
