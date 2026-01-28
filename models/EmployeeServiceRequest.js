/**
 * EmployeeServiceRequest Model
 * Mongoose schema for the employee_service_requests collection
 */

import mongoose from 'mongoose';

const employeeServiceRequestSchema = new mongoose.Schema(
    {
        employeeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Employee',
            required: [true, 'Employee ID is required'],
        },
        managerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Manager',
            required: [true, 'Manager ID is required'],
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
        status: {
            type: String,
            enum: ['Pending', 'In Progress', 'Resolved'],
            default: 'Pending',
        },
        managerResponse: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
        collection: 'employee_service_requests',
    }
);

const EmployeeServiceRequest = mongoose.model('EmployeeServiceRequest', employeeServiceRequestSchema);

export default EmployeeServiceRequest;
