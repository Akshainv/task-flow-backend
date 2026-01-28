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
    getTasks,
    updateTaskProgress,
    approveTaskProgress,
    uploadTaskPhotos,
} from '../controllers/taskController.js';
import { protectManager, protectEmployee, protectManagerOrEmployee, protectAny } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route   POST /api/tasks/:id/progress
 * @desc    Submit task progress update (Photos & Notes)
 * @access  Private (Employee only)
 */
router.post('/:id/progress',
    protectEmployee,
    (req, res, next) => {
        console.log(`\n[SNIFFER] Request to ${req.originalUrl}`);
        console.log(`[SNIFFER] Content-Type: ${req.headers['content-type']}`);
        next();
    },
    uploadTaskPhotos.array('photos', 5),
    updateTaskProgress
);

/**
 * @route   PUT /api/tasks/:id/approve
 * @desc    Approve or Reject task progress update
 * @access  Private (Manager only)
 */
router.put('/:id/approve', protectManager, approveTaskProgress);

/**
 * @route   GET /api/tasks
 * @desc    Get all tasks (Role-based)
 * @access  Private
 */
router.get('/', protectAny, getTasks);

/**
 * @route   GET /api/tasks/my-tasks
 * @desc    Get all tasks for the logged-in employee
 * @access  Private (Employee only)
 */
router.get('/my-tasks', protectEmployee, getMyTasks);

/**
 * @route   GET /api/tasks/employee/:employeeId
 * @desc    Get all tasks for a specific employee
 * @access  Private (Admin/Manager or matching Employee)
 */
router.get('/employee/:employeeId', protectAny, getMyTasks); // We can reuse getMyTasks if we modify it to handle params

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
