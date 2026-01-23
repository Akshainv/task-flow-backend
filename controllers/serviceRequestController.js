/**
 * Service Request Controller
 * Handles CRUD operations for service requests
 */

import mongoose from 'mongoose';
import ServiceRequest from '../models/ServiceRequest.js';
import { createNotification } from './notificationController.js';

/**
 * @desc    Create new service request
 * @route   POST /api/service-requests
 * @access  Private (Manager only)
 */
export const createServiceRequest = async (req, res) => {
    try {
        // Ensure req.user exists (set by protectManager middleware)
        if (!req.user || !req.user._id) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized. Please login as a Manager.',
            });
        }

        const { serviceType, description, priority } = req.body;

        // Validate required fields
        if (!serviceType || !serviceType.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Service type is required',
            });
        }

        if (!description || !description.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Description is required',
            });
        }

        if (!priority) {
            return res.status(400).json({
                success: false,
                message: 'Priority is required',
            });
        }

        // Validate priority value
        if (!['Low', 'Medium', 'High'].includes(priority)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid priority. Must be Low, Medium, or High.',
            });
        }

        // Create service request
        const serviceRequest = await ServiceRequest.create({
            managerId: req.user._id,
            managerName: req.user.name,
            serviceType: serviceType.trim(),
            description: description.trim(),
            priority,
        });

        res.status(201).json({
            success: true,
            message: 'Service request created successfully',
            serviceRequest,
        });
    } catch (error) {
        console.error('Create Service Request Error:', error.message);
        console.error('Stack:', error.stack);

        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.',
        });
    }
};

/**
 * @desc    Get all service requests for the logged-in manager
 * @route   GET /api/service-requests/my-requests
 * @access  Private (Manager only)
 */
export const getMyServiceRequests = async (req, res) => {
    try {
        // Ensure req.user exists (set by protectManager middleware)
        if (!req.user || !req.user._id) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized. Please login as a Manager.',
            });
        }

        const serviceRequests = await ServiceRequest.find({ managerId: req.user._id })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: serviceRequests.length,
            serviceRequests,
        });
    } catch (error) {
        console.error('Get My Service Requests Error:', error.message);
        console.error('Stack:', error.stack);

        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.',
        });
    }
};

/**
 * @desc    Get all service requests (Admin)
 * @route   GET /api/service-requests
 * @access  Private (Admin only)
 */
export const getAllServiceRequests = async (req, res) => {
    try {
        const serviceRequests = await ServiceRequest.find()
            .populate('managerId', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: serviceRequests.length,
            serviceRequests,
        });
    } catch (error) {
        console.error('Get All Service Requests Error:', error.message);
        console.error('Stack:', error.stack);

        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.',
        });
    }
};

/**
 * @desc    Update service request status and admin response
 * @route   PUT /api/service-requests/:id
 * @access  Private (Admin only)
 */
export const updateServiceRequest = async (req, res) => {
    try {
        const { status, adminResponse } = req.body;

        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid service request ID format',
            });
        }

        const serviceRequest = await ServiceRequest.findById(req.params.id);

        if (!serviceRequest) {
            return res.status(404).json({
                success: false,
                message: 'Service request not found',
            });
        }

        // Validate status if provided
        if (status) {
            if (!['Pending', 'In Progress', 'Resolved'].includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid status. Must be Pending, In Progress, or Resolved.',
                });
            }
            serviceRequest.status = status;
        }

        // Update admin response if provided
        if (adminResponse !== undefined) {
            serviceRequest.adminResponse = adminResponse?.trim() || '';
        }

        await serviceRequest.save();

        // Notify the manager about the update
        await createNotification({
            userId: serviceRequest.managerId,
            userType: 'Manager',
            title: 'Service Request Updated',
            message: `Your service request (${serviceRequest.serviceType}) status has been updated to: ${serviceRequest.status}`,
            type: 'service_request',
            relatedId: serviceRequest._id
        });

        res.status(200).json({
            success: true,
            message: 'Service request updated successfully',
            serviceRequest,
        });
    } catch (error) {
        console.error('Update Service Request Error:', error.message);
        console.error('Stack:', error.stack);

        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.',
        });
    }
};

/**
 * @desc    Delete service request permanently
 * @route   DELETE /api/service-requests/:id
 * @access  Private (Manager - own, Admin - any)
 */
export const deleteServiceRequest = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid service request ID format',
            });
        }

        const serviceRequest = await ServiceRequest.findById(req.params.id);

        if (!serviceRequest) {
            return res.status(404).json({
                success: false,
                message: 'Service request not found',
            });
        }

        // Manager can only delete their own requests
        if (req.user && req.user.role === 'manager') {
            if (serviceRequest.managerId.toString() !== req.user._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. You can only delete your own requests.',
                });
            }
        }

        await ServiceRequest.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Service request deleted successfully',
        });
    } catch (error) {
        console.error('Delete Service Request Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.',
        });
    }
};
