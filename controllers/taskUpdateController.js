import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Task from '../models/Task.js';
import Project from '../models/Project.js';
import { createNotification } from './notificationController.js';

// Configure storage for task media
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/tasks';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, `task-${req.params.id || 'unknown'}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

export const taskUpload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp|mp4|mov|avi|mp3|wav|m4a/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only images, videos, and audio files are allowed!'));
    }
});

/**
 * @desc    Submit Task Progress (Employee)
 * @route   POST /api/task-updates/:id/submit
 * @access  Private (Employee)
 */
export const submitTaskProgress = async (req, res) => {
    try {
        const { notes } = req.body;
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        // Only assigned employee can submit progress
        if (task.assignedEmployee.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const photos = req.files?.photos?.map(f => `/uploads/tasks/${f.filename}`) || [];
        const videos = req.files?.videos?.map(f => `/uploads/tasks/${f.filename}`) || [];
        const audio = req.files?.audio?.map(f => `/uploads/tasks/${f.filename}`) || [];

        const update = {
            photos,
            videos,
            audio,
            notes,
            submittedAt: new Date(),
            status: 'pending'
        };

        task.progressUpdates.push(update);
        task.pendingApproval = true;

        await task.save();

        // Notify Manager
        await createNotification({
            userId: task.createdBy,
            userType: 'Manager',
            title: 'Task Progress Submitted',
            message: `Employee ${req.user.name} submitted progress for task: ${task.taskName}`,
            type: 'task',
            relatedId: task._id
        });

        res.status(200).json({
            success: true,
            message: 'Progress submitted for approval',
            task
        });
    } catch (error) {
        console.error('Submit Progress Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * @desc    Approve/Reject Task Progress (Manager)
 * @route   PUT /api/task-updates/:id/approve
 * @access  Private (Manager)
 */
export const approveTaskProgress = async (req, res) => {
    try {
        const { status, approvalNote } = req.body; // status: 'approved' or 'rejected'
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        // Only creator (manager) can approve
        if (task.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        // Update the latest pending request
        const latestUpdate = task.progressUpdates.find(u => u.status === 'pending');
        if (latestUpdate) {
            latestUpdate.status = status;
            latestUpdate.approvalNote = approvalNote;
            latestUpdate.approvedAt = new Date();
        }

        if (status === 'approved') {
            task.status = 'Completed';
            task.pendingApproval = false;
        } else {
            // If rejected, task stays "In Progress" (or whatever it was)
            task.pendingApproval = false;
        }

        await task.save();

        // Update Project Progress if task is completed
        if (status === 'approved') {
            const project = await Project.findById(task.project);
            if (project) {
                const totalTasks = await Task.countDocuments({ project: project._id });
                const completedTasks = await Task.countDocuments({ project: project._id, status: 'Completed' });

                // If all tasks completed, update project status
                if (totalTasks > 0 && totalTasks === completedTasks) {
                    project.status = 'Completed';
                    await project.save();
                } else if (completedTasks > 0) {
                    project.status = 'Ongoing';
                    await project.save();
                }
            }
        }

        // Notify Employee
        await createNotification({
            userId: task.assignedEmployee,
            userType: 'Employee',
            title: status === 'approved' ? 'Task Approved' : 'Task Progress Rejected',
            message: status === 'approved'
                ? `Your progress for task "${task.taskName}" was approved.`
                : `Your progress for task "${task.taskName}" was rejected. Note: ${approvalNote || 'None'}`,
            type: 'task',
            relatedId: task._id
        });

        res.status(200).json({
            success: true,
            message: `Task update ${status} successfully`,
            task
        });
    } catch (error) {
        console.error('Approve Progress Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
