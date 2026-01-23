/**
 * ServiceRequest Model
 * Mongoose schema for the service_requests collection
 */

import mongoose from 'mongoose';

const serviceRequestSchema = new mongoose.Schema(
    {
        managerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Manager',
            required: [true, 'Manager ID is required'],
        },
        managerName: {
            type: String,
            required: [true, 'Manager name is required'],
            trim: true,
        },
        serviceType: {
            type: String,
            required: [true, 'Service type is required'],
            trim: true,
        },
        description: {
            type: String,
            required: [true, 'Description is required'],
            trim: true,
        },
        priority: {
            type: String,
            enum: ['Low', 'Medium', 'High'],
            required: [true, 'Priority is required'],
        },
        status: {
            type: String,
            enum: ['Pending', 'In Progress', 'Resolved'],
            default: 'Pending',
        },
        adminResponse: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
        collection: 'service_requests',
    }
);

const ServiceRequest = mongoose.model('ServiceRequest', serviceRequestSchema);

export default ServiceRequest;
