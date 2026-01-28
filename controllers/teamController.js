/**
 * Team Controller
 * Handles CRUD operations for teams
 */

import Team from '../models/Team.js';
import Manager from '../models/Manager.js';
import Employee from '../models/Employee.js';

/**
 * @desc    Create new team
 * @route   POST /api/teams
 * @access  Private (Admin or Manager)
 */
export const createTeam = async (req, res) => {
    try {
        const { name, description, managerId, employeeIds } = req.body;

        // Validate required fields
        if (!name || !managerId) {
            return res.status(400).json({
                success: false,
                message: 'Please provide team name and manager ID',
            });
        }

        // Check if team name already exists
        const existingTeam = await Team.findOne({ name: name.trim() });
        if (existingTeam) {
            return res.status(400).json({
                success: false,
                message: 'Team with this name already exists',
            });
        }

        // Verify manager exists
        const manager = await Manager.findById(managerId);
        if (!manager) {
            return res.status(404).json({
                success: false,
                message: 'Manager not found',
            });
        }

        // Create team
        const team = await Team.create({
            name: name.trim(),
            description: description?.trim(),
            managerId,
            employeeIds: employeeIds || [],
        });

        res.status(201).json({
            success: true,
            message: 'Team created successfully',
            team,
        });
    } catch (error) {
        console.error('Create Team Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.',
        });
    }
};

/**
 * @desc    Get all teams
 * @route   GET /api/teams
 * @access  Private
 */
export const getAllTeams = async (req, res) => {
    try {
        let query = {};

        // If manager, only show their teams
        if (req.user.role === 'manager') {
            query.managerId = req.user.id;
        }

        const teams = await Team.find(query)
            .populate('managerId', 'name email')
            .populate('employeeIds', 'name email designation')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: teams.length,
            teams,
        });
    } catch (error) {
        console.error('Get Teams Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.',
        });
    }
};

/**
 * @desc    Get teams by manager ID
 * @route   GET /api/teams/manager/:managerId
 * @access  Private (Admin or Manager)
 */
export const getTeamsByManagerId = async (req, res) => {
    try {
        const { managerId } = req.params;

        // Authorization: Admin can see any, Manager only their own
        if (req.user.role === 'manager' && req.user._id.toString() !== managerId) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized access to this manager\'s teams',
            });
        }

        const teams = await Team.find({ managerId })
            .populate('managerId', 'name email')
            .populate('employeeIds', 'name email designation')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: teams.length,
            teams,
        });
    } catch (error) {
        console.error('Get Manager Teams Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.',
        });
    }
};

/**
 * @desc    Get single team by ID
 * @route   GET /api/teams/:id
 * @access  Private
 */
export const getTeamById = async (req, res) => {
    try {
        const team = await Team.findById(req.params.id)
            .populate('managerId', 'name email')
            .populate('employeeIds', 'name email designation');

        if (!team) {
            return res.status(404).json({
                success: false,
                message: 'Team not found',
            });
        }

        res.status(200).json({
            success: true,
            team,
        });
    } catch (error) {
        console.error('Get Team Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.',
        });
    }
};

/**
 * @desc    Update team
 * @route   PUT /api/teams/:id
 * @access  Private (Admin or Manager)
 */
export const updateTeam = async (req, res) => {
    try {
        const { name, description, managerId, employeeIds, status } = req.body;

        const team = await Team.findById(req.params.id);
        if (!team) {
            return res.status(404).json({
                success: false,
                message: 'Team not found',
            });
        }

        // Update fields
        if (name && name.trim() !== team.name) {
            // Check if team name already exists
            const existingTeam = await Team.findOne({ name: name.trim() });
            if (existingTeam) {
                return res.status(400).json({
                    success: false,
                    message: 'Team with this name already exists',
                });
            }
            team.name = name.trim();
        }

        if (description !== undefined) team.description = description.trim();
        if (managerId) team.managerId = managerId;
        if (employeeIds) team.employeeIds = employeeIds;
        if (status) team.status = status;

        await team.save();

        res.status(200).json({
            success: true,
            message: 'Team updated successfully',
            team,
        });
    } catch (error) {
        console.error('Update Team Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.',
        });
    }
};

/**
 * @desc    Delete team
 * @route   DELETE /api/teams/:id
 * @access  Private (Admin only)
 */
export const deleteTeam = async (req, res) => {
    try {
        const team = await Team.findById(req.params.id);
        if (!team) {
            return res.status(404).json({
                success: false,
                message: 'Team not found',
            });
        }

        await Team.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Team deleted successfully',
        });
    } catch (error) {
        console.error('Delete Team Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.',
        });
    }
};
