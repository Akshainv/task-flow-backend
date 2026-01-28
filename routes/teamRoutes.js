/**
 * Team Routes
 * Handles all team-related endpoints
 */

import express from 'express';
import {
    createTeam,
    getAllTeams,
    getTeamsByManagerId,
    getTeamById,
    updateTeam,
    deleteTeam,
} from '../controllers/teamController.js';
import { protect, protectAny } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route   POST /api/teams
 * @desc    Create a new team
 * @access  Private (Admin/Manager)
 */
router.post('/', protectAny, createTeam);

/**
 * @route   GET /api/teams
 * @desc    Get all teams
 * @access  Private (Admin/Manager)
 */
router.get('/', protectAny, getAllTeams);

/**
 * @route   GET /api/teams/manager/:managerId
 * @desc    Get all teams for a specific manager
 * @access  Private (Admin/Manager)
 */
router.get('/manager/:managerId', protectAny, getTeamsByManagerId);

/**
 * @route   GET /api/teams/:id
 * @desc    Get single team by ID
 * @access  Private (Admin/Manager)
 */
router.get('/:id', protectAny, getTeamById);

/**
 * @route   PUT /api/teams/:id
 * @desc    Update team
 * @access  Private (Admin/Manager)
 */
router.put('/:id', protectAny, updateTeam);

/**
 * @route   DELETE /api/teams/:id
 * @desc    Delete team
 * @access  Private (Admin only)
 */
router.delete('/:id', protect, deleteTeam);

export default router;
