/**
 * Project Routes
 * Handles all project-related endpoints
 */

import express from 'express';
import {
    createProject,
    getAllProjects,
    getProjectById,
    updateProject,
    deleteProject,
} from '../controllers/projectController.js';
import { protectManager, protectAny } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route   POST /api/projects
 * @desc    Create a new project
 * @access  Private (Manager only)
 */
router.post('/', protectAny, createProject);

/**
 * @route   GET /api/projects
 * @desc    Get all projects (Admin - all, Manager - own, Employee - assigned)
 * @access  Private (All roles)
 */
router.get('/', protectAny, getAllProjects);

/**
 * @route   GET /api/projects/:id
 * @desc    Get single project by ID
 * @access  Private (All roles with role-based filtering)
 */
router.get('/:id', protectAny, getProjectById);

/**
 * @route   PUT /api/projects/:id
 * @desc    Update project
 * @access  Private (Admin - all projects, Manager - own projects)
 */
router.put('/:id', protectAny, updateProject);

/**
 * @route   DELETE /api/projects/:id
 * @desc    Delete project
 * @access  Private (Admin - all projects, Manager - own projects)
 */
router.delete('/:id', protectAny, deleteProject);

export default router;
