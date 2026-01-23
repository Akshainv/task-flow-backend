/**
 * Task Routes
 * Handles all task-related endpoints
 */

import express from 'express';
import {
    createTask,
    getTasksByProject,
    getTaskById,
    updateTask,
    deleteTask,
    getMyTasks,
} from '../controllers/taskController.js';
import { protectManager, protectEmployee, protectManagerOrEmployee, protectAny } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route   GET /api/tasks/my-tasks
 * @desc    Get all tasks for the logged-in employee
 * @access  Private (Employee only)
 */
router.get('/my-tasks', protectEmployee, getMyTasks);

/**
 * @route   POST /api/tasks/project/:projectId
 * @desc    Create a new task under a specific project
 * @access  Private (Manager only)
 */
router.post('/project/:projectId', protectManager, createTask);

/**
 * @route   GET /api/tasks/project/:projectId
 * @desc    Get tasks by project (Manager - all, Employee - assigned only)
 * @access  Private (Manager/Employee/Admin)
 */
router.get('/project/:projectId', protectAny, getTasksByProject);

/**
 * @route   GET /api/tasks/:id
 * @desc    Get single task by ID
 * @access  Private (Manager/Employee/Admin with role-based filtering)
 */
router.get('/:id', protectAny, getTaskById);

/**
 * @route   PUT /api/tasks/:id
 * @desc    Update task (Manager - full edit, Employee - status only)
 * @access  Private (Manager/Employee)
 */
router.put('/:id', protectManagerOrEmployee, updateTask);

/**
 * @route   DELETE /api/tasks/:id
 * @desc    Delete task
 * @access  Private (Manager only - own tasks)
 */
router.delete('/:id', protectManager, deleteTask);

export default router;
