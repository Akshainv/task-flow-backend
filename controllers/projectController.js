/**
 * Project Controller
 * Handles CRUD operations for projects
 */

import mongoose from 'mongoose';
import Project from '../models/Project.js';
import Employee from '../models/Employee.js';
import Task from '../models/Task.js';
import { createNotification } from './notificationController.js';

/**
 * @desc    Create new project
 * @route   POST /api/projects
 * @access  Private (Manager only)
 */
export const createProject = async (req, res) => {
    try {
        // Safety check: Ensure req.user exists (should be set by protectManager middleware)
        if (!req.user || !req.user._id) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized. Please login as a Manager.',
            });
        }

        const { projectName, description, clientName, clientPhone, location, assignedEmployees, deadline, status } = req.body;

        // Validate required fields
        if (!projectName) {
            return res.status(400).json({
                success: false,
                message: 'Project name is required',
            });
        }

        if (!assignedEmployees || assignedEmployees.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'At least one employee must be assigned',
            });
        }

        // Validate that all assignedEmployees are valid ObjectIds
        const invalidIds = assignedEmployees.filter(id => !mongoose.Types.ObjectId.isValid(id));
        if (invalidIds.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid employee ID format',
            });
        }

        // Verify all assigned employees exist
        const employeeCount = await Employee.countDocuments({
            _id: { $in: assignedEmployees }
        });

        if (employeeCount !== assignedEmployees.length) {
            return res.status(400).json({
                success: false,
                message: 'One or more assigned employees not found',
            });
        }

        // Create project
        const project = await Project.create({
            projectName: projectName.trim(),
            description: description?.trim() || '',
            clientName: clientName?.trim() || '',
            clientPhone: clientPhone?.trim() || '',
            location: location?.trim() || '',
            assignedEmployees,
            deadline: deadline || null,
            status: status || 'Pending',
            createdBy: req.user._id, // Manager ID from auth middleware
        });

        // Populate employee details for response
        await project.populate('assignedEmployees', 'name email designation');
        await project.populate('createdBy', 'name email');

        // Create notifications for assigned employees
        if (assignedEmployees && assignedEmployees.length > 0) {
            assignedEmployees.forEach(async (employeeId) => {
                await createNotification({
                    userId: employeeId,
                    userType: 'Employee',
                    title: 'New Project Assigned',
                    message: `You have been assigned to a new project: ${project.projectName}`,
                    type: 'project_created',
                    relatedId: project._id
                });
            });
        }

        res.status(201).json({
            success: true,
            message: 'Project created successfully',
            project,
        });
    } catch (error) {
        console.error('Create Project Error:', error.message);
        console.error('Stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};

/**
 * @desc    Get all projects
 * @route   GET /api/projects
 * @access  Private (Admin - all projects, Manager - own projects)
 */
export const getAllProjects = async (req, res) => {
    try {
        let projects;

        // Check role from the authenticated user
        if (req.user.role === 'admin') {
            // Admin can see all projects
            projects = await Project.find()
                .populate('assignedEmployees', 'name email designation')
                .populate('createdBy', 'name email')
                .sort({ createdAt: -1 });
        } else if (req.user.role === 'manager') {
            // Manager can only see their own projects
            projects = await Project.find({ createdBy: req.user._id })
                .populate('assignedEmployees', 'name email designation')
                .populate('createdBy', 'name email')
                .sort({ createdAt: -1 });
        } else if (req.user.role === 'employee') {
            // Employee can see projects they are assigned to
            projects = await Project.find({ assignedEmployees: req.user._id })
                .populate('assignedEmployees', 'name email designation')
                .populate('createdBy', 'name email')
                .sort({ createdAt: -1 });
        } else {
            return res.status(403).json({
                success: false,
                message: 'Access denied.',
            });
        }

        res.status(200).json({
            success: true,
            count: projects.length,
            projects,
        });
    } catch (error) {
        console.error('Get Projects Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.',
        });
    }
};

/**
 * @desc    Get single project by ID
 * @route   GET /api/projects/:id
 * @access  Private (All roles with appropriate filtering)
 */
export const getProjectById = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('assignedEmployees', 'name email designation')
            .populate('createdBy', 'name email');

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found',
            });
        }

        // Role-based access check
        if (req.user.role === 'admin') {
            // Admin can view any project
        } else if (req.user.role === 'manager') {
            // Manager can only view their own projects
            if (project.createdBy._id.toString() !== req.user._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. You can only view your own projects.',
                });
            }
        } else if (req.user.role === 'employee') {
            // Employee can only view projects they are assigned to
            const isAssigned = project.assignedEmployees.some(
                emp => emp._id.toString() === req.user._id.toString()
            );
            if (!isAssigned) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. You are not assigned to this project.',
                });
            }
        } else {
            return res.status(403).json({
                success: false,
                message: 'Access denied.',
            });
        }

        // Fetch associated tasks
        const tasks = await Task.find({ project: project._id })
            .populate('assignedEmployee', 'name email designation')
            .populate('project', 'projectName');

        res.status(200).json({
            success: true,
            project: {
                ...project._doc,
                tasks
            }
        });
    } catch (error) {
        console.error('Get Project Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.',
        });
    }
};

/**
 * @desc    Update project
 * @route   PUT /api/projects/:id
 * @access  Private (Manager only - own projects)
 */
export const updateProject = async (req, res) => {
    try {
        const { projectName, description, clientName, clientPhone, location, assignedEmployees, deadline, status } = req.body;

        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found',
            });
        }

        // Only the manager who created the project can update it
        if (project.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only update your own projects.',
            });
        }

        // Validate assigned employees if provided
        if (assignedEmployees && assignedEmployees.length > 0) {
            const employeeCount = await Employee.countDocuments({
                _id: { $in: assignedEmployees }
            });

            if (employeeCount !== assignedEmployees.length) {
                return res.status(400).json({
                    success: false,
                    message: 'One or more assigned employees not found',
                });
            }
        }

        // Update fields
        if (projectName) project.projectName = projectName.trim();
        if (description !== undefined) project.description = description?.trim();
        if (clientName !== undefined) project.clientName = clientName?.trim();
        if (clientPhone !== undefined) project.clientPhone = clientPhone?.trim();
        if (location !== undefined) project.location = location?.trim();
        if (assignedEmployees) project.assignedEmployees = assignedEmployees;
        if (deadline !== undefined) project.deadline = deadline;
        if (status) project.status = status;

        await project.save();

        // Populate for response
        await project.populate('assignedEmployees', 'name email designation');
        await project.populate('createdBy', 'name email');

        res.status(200).json({
            success: true,
            message: 'Project updated successfully',
            project,
        });
    } catch (error) {
        console.error('Update Project Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.',
        });
    }
};

/**
 * @desc    Delete project
 * @route   DELETE /api/projects/:id
 * @access  Private (Manager only - own projects)
 */
export const deleteProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found',
            });
        }

        // Only the manager who created the project can delete it
        if (project.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only delete your own projects.',
            });
        }

        await Project.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Project deleted successfully',
        });
    } catch (error) {
        console.error('Delete Project Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.',
        });
    }
};
