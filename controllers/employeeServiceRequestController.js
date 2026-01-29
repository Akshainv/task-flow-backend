/**
 * Employee Service Request Controller
 * Handles CRUD operations for service requests from employees to managers
 */

import mongoose from 'mongoose';
import EmployeeServiceRequest from '../models/EmployeeServiceRequest.js';
import Manager from '../models/Manager.js';
import { createNotification } from './notificationController.js';

/**
 * @desc    Create new service request from employee to manager
 * @route   POST /api/employee-service-requests
 * @access  Private (Employee only)
 */
export const createEmployeeServiceRequest = async (req, res) => {
    try {
        const { serviceType, description } = req.body;

        if (!serviceType || !description) {
            return res.status(400).json({
                success: false,
                message: 'Service type and description are required',
            });
        }

        // Find the manager for this employee
        const manager = await Manager.findOne({ employees: req.user._id });

        if (!manager) {
            return res.status(404).json({
                success: false,
                message: 'No manager assigned to this employee. Please contact admin.',
            });
        }

        const serviceRequest = await EmployeeServiceRequest.create({
            employeeId: req.user._id,
            managerId: manager._id,
            serviceType: serviceType.trim(),
            description: description.trim(),
        });

        // Notify the manager
        await createNotification({
            userId: manager._id,
            userType: 'Manager',
            title: 'New Service Request',
            message: `Employee ${req.user.name} has sent a new service request: ${serviceType}`,
            type: 'service_request',
            relatedId: serviceRequest._id
        });

        res.status(201).json({
            success: true,
            message: 'Service request sent to manager successfully',
            serviceRequest,
        });
    } catch (error) {
        console.error('Create Employee Service Request Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.',
        });
    }
};

/**
 * @desc    Get all service requests for the logged-in employee (his own)
 * @route   GET /api/employee-service-requests/my-requests
 * @access  Private (Employee only)
 */
export const getMyEmployeeServiceRequests = async (req, res) => {
    try {
        const employeeId = req.user._id;

        const serviceRequests = await EmployeeServiceRequest.find({ employeeId })
            .populate('managerId', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: serviceRequests.length,
            serviceRequests,
        });
    } catch (error) {
        console.error('Get My Employee Service Requests Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.',
        });
    }
};

/**
 * @desc    Get all service requests from employees for the logged-in manager
 * @route   GET /api/employee-service-requests/received
 * @access  Private (Manager only)
 */
export const getReceivedEmployeeServiceRequests = async (req, res) => {
    try {
        const managerId = req.user._id;

        const serviceRequests = await EmployeeServiceRequest.find({ managerId })
            .populate('employeeId', 'name email designation')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: serviceRequests.length,
            serviceRequests,
        });
    } catch (error) {
        console.error('Get Received Employee Service Requests Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.',
        });
    }
};

/**
 * @desc    Update service request status (Manager)
 * @route   PUT /api/employee-service-requests/:id
 * @access  Private (Manager only)
 */
export const updateEmployeeServiceRequest = async (req, res) => {
    try {
        const { status, managerResponse } = req.body;

        const serviceRequest = await EmployeeServiceRequest.findById(req.params.id);

        if (!serviceRequest) {
            return res.status(404).json({
                success: false,
                message: 'Service request not found',
            });
        }

        // Only the assigned manager can update it
        if (serviceRequest.managerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only the assigned manager can update this request.',
            });
        }

        if (status) serviceRequest.status = status;
        if (managerResponse !== undefined) serviceRequest.managerResponse = managerResponse;

        await serviceRequest.save();

        // Notify the employee
        await createNotification({
            userId: serviceRequest.employeeId,
            userType: 'Employee',
            title: 'Service Request Updated',
            message: `Your manager has updated your service request (${serviceRequest.serviceType}) to: ${serviceRequest.status}`,
            type: 'service_request',
            relatedId: serviceRequest._id
        });

        res.status(200).json({
            success: true,
            message: 'Service request updated successfully',
            serviceRequest,
        });
    } catch (error) {
        console.error('Update Employee Service Request Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.',
        });
    }
};

/**
 * @desc    Delete service request
 * @route   DELETE /api/employee-service-requests/:id
 * @access  Private (Employee - own, Manager - any received)
 */
export const deleteEmployeeServiceRequest = async (req, res) => {
    try {
        const serviceRequest = await EmployeeServiceRequest.findById(req.params.id);

        if (!serviceRequest) {
            return res.status(404).json({
                success: false,
                message: 'Service request not found',
            });
        }

        // Authorization check
        const isOwner = serviceRequest.employeeId.toString() === req.user._id.toString();
        const isReceiver = serviceRequest.managerId.toString() === req.user._id.toString();

        if (!isOwner && !isReceiver) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only delete your own or received requests.',
            });
        }

        await EmployeeServiceRequest.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Service request deleted successfully',
        });
    } catch (error) {
        console.error('Delete Employee Service Request Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.',
        });
    }
};
