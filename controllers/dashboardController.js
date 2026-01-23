/**
 * Dashboard Controller
 * Provides statistics for Admin, Manager, and Employee dashboards
 */

import Employee from '../models/Employee.js';
import Manager from '../models/Manager.js';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import ServiceRequest from '../models/ServiceRequest.js';

/**
 * @desc    Get admin dashboard statistics
 * @route   GET /api/dashboard/admin
 * @access  Private (Admin only)
 */
export const getAdminDashboardStats = async (req, res) => {
    try {
        // Get counts
        const totalEmployees = await Employee.countDocuments();
        const totalManagers = await Manager.countDocuments();
        const totalProjects = await Project.countDocuments();

        // Get recent service requests (last 10)
        const recentServiceRequests = await ServiceRequest.find()
            .populate('managerId', 'name email')
            .sort({ createdAt: -1 })
            .limit(10);

        res.status(200).json({
            success: true,
            stats: {
                totalEmployees,
                totalManagers,
                totalProjects,
            },
            recentServiceRequests,
        });
    } catch (error) {
        console.error('Get Admin Dashboard Stats Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.',
        });
    }
};

/**
 * @desc    Get manager dashboard statistics
 * @route   GET /api/dashboard/manager
 * @access  Private (Manager only)
 */
export const getManagerDashboardStats = async (req, res) => {
    try {
        // Get manager's projects
        const managerProjects = await Project.find({ createdBy: req.user._id });
        const projectIds = managerProjects.map(p => p._id);

        // Count ongoing projects (status not completed)
        const ongoingProjects = await Project.countDocuments({
            createdBy: req.user._id,
            status: { $ne: 'Completed' }
        });

        // Count completed projects
        const completedProjects = await Project.countDocuments({
            createdBy: req.user._id,
            status: 'Completed'
        });

        // Count pending tasks in manager's projects
        const pendingTasks = await Task.countDocuments({
            project: { $in: projectIds },
            status: 'Pending'
        });

        // Get total projects if status field doesn't exist
        const totalProjects = managerProjects.length;

        res.status(200).json({
            success: true,
            stats: {
                ongoingProjects: ongoingProjects || totalProjects,
                completedProjects,
                pendingTasks,
                totalProjects,
            },
        });
    } catch (error) {
        console.error('Get Manager Dashboard Stats Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.',
        });
    }
};

/**
 * @desc    Get employee dashboard statistics
 * @route   GET /api/dashboard/employee
 * @access  Private (Employee only)
 */
export const getEmployeeDashboardStats = async (req, res) => {
    try {
        // Count all tasks assigned to employee
        const myTasks = await Task.countDocuments({
            assignedEmployee: req.user._id
        });

        // Count completed tasks
        const completedTasks = await Task.countDocuments({
            assignedEmployee: req.user._id,
            status: 'Completed'
        });

        // Count in-progress tasks
        const inProgressTasks = await Task.countDocuments({
            assignedEmployee: req.user._id,
            status: 'In Progress'
        });

        // Count pending tasks
        const pendingTasks = await Task.countDocuments({
            assignedEmployee: req.user._id,
            status: 'Pending'
        });

        res.status(200).json({
            success: true,
            stats: {
                myTasks,
                completedTasks,
                inProgressTasks,
                pendingTasks,
            },
        });
    } catch (error) {
        console.error('Get Employee Dashboard Stats Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.',
        });
    }
};
