import express from 'express';
import {
    submitTaskProgress,
    approveTaskProgress,
    taskUpload
} from '../controllers/taskUpdateController.js';
import { protectManager, protectEmployee } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route   POST /api/task-updates/:id/submit
 * @desc    Submit task progress with media
 * @access  Private (Employee)
 */
router.post('/:id/submit', protectEmployee, taskUpload.fields([
    { name: 'photos', maxCount: 10 },
    { name: 'videos', maxCount: 2 },
    { name: 'audio', maxCount: 5 }
]), submitTaskProgress);

/**
 * @route   PUT /api/task-updates/:id/approve
 * @desc    Approve or Reject task completion
 * @access  Private (Manager)
 */
router.put('/:id/approve', protectManager, approveTaskProgress);

export default router;
