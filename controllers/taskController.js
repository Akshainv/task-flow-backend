/**
 * Task Controller
 * Handles CRUD operations for tasks
 */

import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import Task from '../models/Task.js';
import Project from '../models/Project.js';
import Employee from '../models/Employee.js';
import Manager from '../models/Manager.js';
import { createNotification } from './notificationController.js';
import { getPaginationParams, getPaginationMeta } from '../utils/pagination.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure storage for task progress photos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/tasks';
        console.log(`[Multer] Saving file to: ${dir}`);
        if (!fs.existsSync(dir)) {
            console.log(`[Multer] Creating directory: ${dir}`);
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `task-${req.params.id}-${Date.now()}${path.extname(file.originalname)}`;
        console.log(`[Multer] Generated filename: ${uniqueName}`);
        cb(null, uniqueName);
    }
});

// Export the raw Multer instance - following Attendance pattern
export const uploadTaskPhotos = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        console.log(`[Multer Filter] Checking file:`, file.originalname, file.mimetype);
        const imageTypes = /jpeg|jpg|png|webp/;
        const audioTypes = /webm|wav|mpeg|mp3|ogg/;

        const isImage = imageTypes.test(file.mimetype) || imageTypes.test(path.extname(file.originalname).toLowerCase());
        const isAudio = audioTypes.test(file.mimetype) || audioTypes.test(path.extname(file.originalname).toLowerCase());

        console.log(`[Multer Filter] Is Image: ${isImage}, Is Audio: ${isAudio}`);

        if (isImage || isAudio) {
            console.log(`[Multer Filter] File accepted: ${file.originalname}`);
            return cb(null, true);
        }
        console.log(`[Multer Filter] File rejected: ${file.originalname} - invalid type`);
        cb(new Error('Only images and audio files are allowed!'));
    }
});

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
        const { taskName, description, assignedEmployee, deadline, priority, deadlineTime } = req.body;
        console.log('[Backend createTask] req.body:', JSON.stringify(req.body));

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
            priority: priority || 'Medium',
            deadlineTime: deadlineTime || '',
            project: projectId,
            createdBy: req.user._id,
        });

        // Populate for response
        await task.populate('assignedEmployee', 'name email designation');
        await task.populate('project', 'projectName');
        await task.populate('createdBy', 'name email');

        // Create notification for assigned employee
        console.log(`Creating notification for task assignment: Employee ${assignedEmployee}`);
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
        const { taskName, description, assignedEmployee, status, deadline, project, priority, deadlineTime } = req.body;

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
            if (priority) task.priority = priority;
            if (deadlineTime !== undefined) task.deadlineTime = deadlineTime;
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
 * @route   GET /api/tasks/employee/:employeeId
 * @access  Private (Employee only or Admin/Manager)
 */
export const getMyTasks = async (req, res) => {
    try {
        const { page, limit, skip } = getPaginationParams(req.query);
        let targetEmployeeId = req.params.employeeId || req.user._id;

        // Validation: Verify targetEmployeeId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(targetEmployeeId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid employee ID format',
            });
        }

        // Authorization checks
        if (req.user.role === 'employee') {
            // Employees can only view their own tasks
            if (targetEmployeeId.toString() !== req.user._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. You can only view your own tasks.',
                });
            }
        } else if (req.user.role === 'manager') {
            // Managers can view any employee tasks but usually those in their team
            // (Optional: Add team membership check here if strictness is required)
        }
        // Admin has full access

        const query = { assignedEmployee: targetEmployeeId };
        const totalCount = await Task.countDocuments(query);
        const tasks = await Task.find(query)
            .populate('assignedEmployee', 'name email designation')
            .populate('project', 'projectName')
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            success: true,
            count: tasks.length,
            tasks,
            pagination: getPaginationMeta(page, limit, totalCount),
        });
    } catch (error) {
        console.error('Get My Tasks Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.',
        });
    }
};

/**
 * @desc    Get all tasks (Admin - all, Manager - team tasks, Employee - own tasks)
 * @route   GET /api/tasks
 * @access  Private
 */
export const getTasks = async (req, res) => {
    try {
        const { page, limit, skip } = getPaginationParams(req.query);
        const { project, priority, status, deadline } = req.query;
        let query = {};

        // Role-based filtering
        if (req.user.role === 'manager') {
            const manager = await Manager.findById(req.user._id);
            const teamMemberIds = manager?.employees || [];
            // Show tasks assigned to team members OR tasks created by the manager
            query = {
                $or: [
                    { createdBy: req.user._id },
                    { assignedEmployee: { $in: teamMemberIds } }
                ]
            };
        } else if (req.user.role === 'employee') {
            query = { assignedEmployee: req.user._id };
        }
        // Admin sees all (empty query initially)

        // Apply additional filters
        if (project && mongoose.Types.ObjectId.isValid(project)) {
            query.project = project;
        }
        if (priority && ['Low', 'Medium', 'High'].includes(priority)) {
            query.priority = priority;
        }
        if (status && ['Pending', 'In Progress', 'Completed'].includes(status)) {
            query.status = status;
        }
        if (deadline) {
            // Support simple deadline filters: 'overdue', 'today', 'upcoming'
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            if (deadline === 'overdue') {
                query.deadline = { $lt: today, $ne: null };
                // Only add status constraint if user hasn't selected a specific status
                if (!status) {
                    query.status = { $ne: 'Completed' };
                }
            } else if (deadline === 'today') {
                query.deadline = { $gte: today, $lt: tomorrow };
            } else if (deadline === 'upcoming') {
                query.deadline = { $gte: tomorrow };
            }
        }

        const totalCount = await Task.countDocuments(query);
        const tasks = await Task.find(query)
            .populate('assignedEmployee', 'name email designation')
            .populate('project', 'projectName')
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            success: true,
            count: tasks.length,
            tasks,
            pagination: getPaginationMeta(page, limit, totalCount),
        });
    } catch (error) {
        console.error('Get Tasks Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.',
        });
    }
};

/**
 * @desc    Submit task progress update (Employee)
 * @route   POST /api/tasks/:id/progress
 * @access  Private (Employee)
 */
export const updateTaskProgress = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

        if (task.assignedEmployee.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        console.log(`[TaskUpdate] Request received for task ${req.params.id}`);
        console.log(`[TaskUpdate] Files:`, req.files ? req.files.length : 0);

        if (req.files && Array.isArray(req.files)) {
            req.files.forEach((f, i) => {
                console.log(`[TaskUpdate] File ${i}: name=${f.originalname}, size=${f.size}`);
            });
        }

        console.log(`[TaskUpdate] Notes:`, req.body.notes);

        const photos = [];
        let voiceNote = null;

        if (req.files && Array.isArray(req.files)) {
            req.files.forEach(file => {
                const filePath = `/uploads/tasks/${file.filename}`;
                if (file.mimetype.startsWith('image/')) {
                    photos.push(filePath);
                } else if (file.mimetype.startsWith('audio/')) {
                    voiceNote = filePath;
                }
            });
        }

        const { notes } = req.body;

        task.progressUpdates.push({
            photos,
            voiceNote,
            notes,
            submittedAt: new Date(),
            approvalStatus: 'pending'
        });
        task.status = 'In Progress';
        task.pendingApproval = true;

        await task.save();

        console.log('[TaskUpdate] Task saved successfully with progress update');

        // Notify Manager
        try {
            await createNotification({
                userId: task.createdBy,
                userType: 'Manager',
                title: 'Task Approval Requested',
                message: `Employee ${req.user.name} has submitted progress for task: ${task.taskName}`,
                type: 'task_updated', // Enum-safe value
                relatedId: task._id
            });
            console.log('[TaskUpdate] Notification sent to manager');
        } catch (notifErr) {
            console.error('[TaskUpdate] Notification failed (non-fatal):', notifErr.message);
        }

        res.status(200).json({ success: true, message: 'Progress submitted for approval', task });
    } catch (error) {
        console.error('Update Progress Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * @desc    Approve or Reject task progress (Manager)
 * @route   PUT /api/tasks/:id/approve
 * @access  Private (Manager)
 */
export const approveTaskProgress = async (req, res) => {
    try {
        const { status, approvalNote } = req.body; // status: 'approved' or 'rejected'
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

        if (task.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const latestUpdate = task.progressUpdates[task.progressUpdates.length - 1];
        if (!latestUpdate) return res.status(400).json({ success: false, message: 'No updates to approve' });

        latestUpdate.approvalStatus = status;
        latestUpdate.approvalNote = approvalNote;
        latestUpdate.approvedAt = new Date();

        if (status === 'approved') {
            task.status = 'Completed';
            task.pendingApproval = false;
        } else {
            task.status = 'In Progress';
            task.pendingApproval = false;
        }

        await task.save();

        // Calculate Project Progress
        const projectTasks = await Task.find({ project: task.project });
        const completedTasks = projectTasks.filter(t => t.status === 'Completed').length;
        const totalTasks = projectTasks.length;
        const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        await Project.findByIdAndUpdate(task.project, { progress: progressPercentage });

        // Notify Employee
        await createNotification({
            userId: task.assignedEmployee,
            userType: 'Employee',
            title: `Task ${status === 'approved' ? 'Approved' : 'Rejected'}`,
            message: `Your update for task "${task.taskName}" has been ${status}. ${approvalNote || ''}`,
            type: 'task',
            relatedId: task._id
        });

        res.status(200).json({ success: true, message: `Task ${status} successfully`, task });
    } catch (error) {
        console.error('Approve Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};