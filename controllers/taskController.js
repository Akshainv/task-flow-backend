/**
 * Task Controller
 * Handles CRUD operations for tasks
 */

import mongoose from 'mongoose';
import Task from '../models/Task.js';
import Project from '../models/Project.js';
import Employee from '../models/Employee.js';
import { createNotification } from './notificationController.js';

/**
 * @desc    Create new task
 * @route   POST /api/tasks
 * @access  Private (Manager only)
 */
export const createTask = async (req, res) => {
    try {
        // Safety check: Ensure req.user exists (should be set by protectManager middleware)
        if (!req.user || !req.user._id) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized. Please login as a Manager.',
            });
        }

        const { projectId } = req.params;
        const { taskName, description, assignedEmployee, deadline } = req.body;

        // Validate required fields
        if (!taskName || !taskName.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Task name is required',
            });
        }

        if (!assignedEmployee) {
            return res.status(400).json({
                success: false,
                message: 'Assigned employee is required',
            });
        }

        // Note: Project validation is moved to after params check

        // Validate ObjectId formats
        if (!mongoose.Types.ObjectId.isValid(assignedEmployee)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid employee ID format',
            });
        }

        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid project ID format',
            });
        }

        // Verify project exists and belongs to the manager
        const projectDoc = await Project.findById(projectId);
        if (!projectDoc) {
            return res.status(404).json({
                success: false,
                message: 'Project not found',
            });
        }

        // Check if manager owns the project
        if (projectDoc.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only create tasks for your own projects.',
            });
        }

        // Verify employee exists
        const employee = await Employee.findById(assignedEmployee);
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found',
            });
        }

        // Check if employee is assigned to the project
        const isAssignedToProject = projectDoc.assignedEmployees.some(
            emp => emp.toString() === assignedEmployee
        );
        if (!isAssignedToProject) {
            return res.status(400).json({
                success: false,
                message: 'Employee must be assigned to the project first',
            });
        }

        // Create task
        const task = await Task.create({
            taskName: taskName.trim(),
            description: description?.trim() || '',
            assignedEmployee,
            deadline: deadline || null,
            project: projectId,
            createdBy: req.user._id,
        });

        // Populate for response
        await task.populate('assignedEmployee', 'name email designation');
        await task.populate('project', 'projectName');
        await task.populate('createdBy', 'name email');

        // Create notification for assigned employee
        await createNotification({
            userId: assignedEmployee,
            userType: 'Employee',
            title: 'New Task Assigned',
            message: `You have been assigned a new task: ${task.taskName}`,
            type: 'task_assigned',
            relatedId: task._id
        });

        res.status(201).json({
            success: true,
            message: 'Task created successfully',
            task,
        });
    } catch (error) {
        console.error('Create Task Error:', error.message);
        console.error('Stack:', error.stack);

        // Handle specific MongoDB errors
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid ID format provided',
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.',
        });
    }
};

/**
 * @desc    Get tasks by project
 * @route   GET /api/tasks/project/:projectId
 * @access  Private (Manager - all project tasks, Employee - assigned tasks only)
 */
export const getTasksByProject = async (req, res) => {
    try {
        const { projectId } = req.params;

        // Verify project exists
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found',
            });
        }

        let tasks;

        if (req.user.role === 'manager') {
            // Manager can only see tasks from their own projects
            if (project.createdBy.toString() !== req.user._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. You can only view tasks from your own projects.',
                });
            }
            tasks = await Task.find({ project: projectId })
                .populate('assignedEmployee', 'name email designation')
                .populate('project', 'projectName')
                .populate('createdBy', 'name email')
                .sort({ createdAt: -1 });
        } else if (req.user.role === 'employee') {
            // Employee can only see tasks assigned to them
            const isAssigned = project.assignedEmployees.some(
                emp => emp.toString() === req.user._id.toString()
            );
            if (!isAssigned) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. You are not assigned to this project.',
                });
            }
            tasks = await Task.find({ project: projectId, assignedEmployee: req.user._id })
                .populate('assignedEmployee', 'name email designation')
                .populate('project', 'projectName')
                .populate('createdBy', 'name email')
                .sort({ createdAt: -1 });
        } else if (req.user.role === 'admin') {
            // Admin can see all tasks in any project
            tasks = await Task.find({ project: projectId })
                .populate('assignedEmployee', 'name email designation')
                .populate('project', 'projectName')
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
            count: tasks.length,
            tasks,
        });
    } catch (error) {
        console.error('Get Tasks By Project Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.',
        });
    }
};

/**
 * @desc    Get single task by ID
 * @route   GET /api/tasks/:id
 * @access  Private (Manager/Employee with appropriate access)
 */
export const getTaskById = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id)
            .populate('assignedEmployee', 'name email designation')
            .populate('project', 'projectName createdBy assignedEmployees')
            .populate('createdBy', 'name email');

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found',
            });
        }

        // Role-based access check
        if (req.user.role === 'admin') {
            // Admin can view any task
        } else if (req.user.role === 'manager') {
            // Manager can only view tasks they created
            if (task.createdBy._id.toString() !== req.user._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. You can only view tasks you created.',
                });
            }
        } else if (req.user.role === 'employee') {
            // Employee can only view tasks assigned to them
            if (task.assignedEmployee._id.toString() !== req.user._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. You can only view tasks assigned to you.',
                });
            }
        } else {
            return res.status(403).json({
                success: false,
                message: 'Access denied.',
            });
        }

        res.status(200).json({
            success: true,
            task,
        });
    } catch (error) {
        console.error('Get Task Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.',
        });
    }
};

/**
 * @desc    Update task
 * @route   PUT /api/tasks/:id
 * @access  Private (Manager - full edit, Employee - status only)
 */
export const updateTask = async (req, res) => {
    try {
        const { taskName, description, assignedEmployee, status, deadline, project } = req.body;

        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found',
            });
        }

        if (req.user.role === 'manager') {
            // Manager can only update tasks they created
            if (task.createdBy.toString() !== req.user._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. You can only update tasks you created.',
                });
            }

            // Validate assigned employee if changing
            if (assignedEmployee && assignedEmployee !== task.assignedEmployee.toString()) {
                const projectDoc = await Project.findById(task.project);
                const isAssignedToProject = projectDoc.assignedEmployees.some(
                    emp => emp.toString() === assignedEmployee
                );
                if (!isAssignedToProject) {
                    return res.status(400).json({
                        success: false,
                        message: 'Employee must be assigned to the project first',
                    });
                }
            }

            // Manager can update all fields
            if (taskName) task.taskName = taskName.trim();
            if (description !== undefined) task.description = description?.trim();
            if (assignedEmployee) task.assignedEmployee = assignedEmployee;
            if (status) task.status = status;
            if (deadline !== undefined) task.deadline = deadline;
            // Note: project change is not allowed after creation

        } else if (req.user.role === 'employee') {
            // Employee can only update tasks assigned to them
            if (task.assignedEmployee.toString() !== req.user._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. You can only update tasks assigned to you.',
                });
            }

            // Employee can only update status
            if (taskName || description !== undefined || assignedEmployee || deadline !== undefined || project) {
                return res.status(403).json({
                    success: false,
                    message: 'Employees can only update task status.',
                });
            }

            if (!status) {
                return res.status(400).json({
                    success: false,
                    message: 'Status is required',
                });
            }

            // Validate status value
            if (!['Pending', 'In Progress', 'Completed'].includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid status. Must be Pending, In Progress, or Completed.',
                });
            }

            task.status = status;
        } else {
            return res.status(403).json({
                success: false,
                message: 'Access denied.',
            });
        }

        await task.save();

        // If status changed to Completed and the updater is the Employee, notify the Manager
        if (status === 'Completed' && req.user.role === 'employee') {
            await createNotification({
                userId: task.createdBy,
                userType: 'Manager',
                title: 'Task Completed',
                message: `Employee ${req.user.name} has completed the task: ${task.taskName}`,
                type: 'task',
                relatedId: task._id
            });
        }

        // Populate for response
        await task.populate('assignedEmployee', 'name email designation');
        await task.populate('project', 'projectName');
        await task.populate('createdBy', 'name email');

        res.status(200).json({
            success: true,
            message: 'Task updated successfully',
            task,
        });
    } catch (error) {
        console.error('Update Task Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.',
        });
    }
};

/**
 * @desc    Delete task
 * @route   DELETE /api/tasks/:id
 * @access  Private (Manager only - own tasks)
 */
export const deleteTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found',
            });
        }

        // Only the manager who created the task can delete it
        if (task.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only delete tasks you created.',
            });
        }

        await Task.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Task deleted successfully',
        });
    } catch (error) {
        console.error('Delete Task Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.',
        });
    }
};

/**
 * @desc    Get all tasks for employee (across all projects)
 * @route   GET /api/tasks/my-tasks
 * @access  Private (Employee only)
 */
export const getMyTasks = async (req, res) => {
    try {
        const tasks = await Task.find({ assignedEmployee: req.user._id })
            .populate('assignedEmployee', 'name email designation')
            .populate('project', 'projectName')
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: tasks.length,
            tasks,
        });
    } catch (error) {
        console.error('Get My Tasks Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.',
        });
    }
};
