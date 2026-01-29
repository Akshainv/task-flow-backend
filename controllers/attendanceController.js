import Attendance from '../models/Attendance.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure storage for attendance photos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/attendance';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

export const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only images (jpeg, jpg, png, webp) are allowed!'));
    }
});

/**
 * @desc    Clock In
 * @route   POST /api/attendance/clock-in
 * @access  Private (Employee)
 */
export const clockIn = async (req, res) => {
    try {
        console.log('Clock-in attempt by user:', req.user?.id);
        console.log('Request body:', req.body);
        console.log('Request file:', req.file);

        const { location } = req.body;
        const employeeId = req.params.employeeId || req.user.id;
        const today = new Date().toISOString().split('T')[0];

        // Check if there is an active (not clocked out) session
        const activeAttendance = await Attendance.findOne({
            employeeId,
            clockOutTime: { $exists: false }
        });

        if (activeAttendance) {
            return res.status(400).json({
                success: false,
                message: 'You are already clocked in. Please clock out first.'
            });
        }

        let parsedLocation = null;
        if (location) {
            try {
                parsedLocation = typeof location === 'string' ? JSON.parse(location) : location;
            } catch (parseError) {
                console.error('Location Parse Error:', parseError);
                // If it's not JSON, maybe it's already an object or just a string
                parsedLocation = { address: location };
            }
        }

        const photoUrl = req.file ? `/uploads/attendance/${req.file.filename}` : null;

        const attendance = await Attendance.create({
            employeeId,
            clockInTime: new Date(),
            location: parsedLocation,
            photoUrl,
            date: today,
            status: 'Present'
        });

        res.status(201).json({
            success: true,
            message: 'Clocked in successfully',
            data: attendance
        });
    } catch (error) {
        console.error('Clock In ERROR:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error during clock-in'
        });
    }
};

/**
 * @desc    Clock Out
 * @route   PUT /api/attendance/clock-out
 * @access  Private (Employee)
 */
export const clockOut = async (req, res) => {
    try {
        const employeeId = req.params.employeeId || req.user.id;
        // Find the most recent active session
        const attendance = await Attendance.findOne({
            employeeId,
            clockOutTime: { $exists: false }
        }).sort({ clockInTime: -1 });

        if (!attendance) {
            return res.status(404).json({
                success: false,
                message: 'No active clock-in session found. Please clock in first.'
            });
        }

        attendance.clockOutTime = new Date();
        await attendance.save();

        res.status(200).json({
            success: true,
            message: 'Clocked out successfully',
            data: attendance
        });
    } catch (error) {
        console.error('Clock Out Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during clock-out'
        });
    }
};

/**
 * @desc    Get Today's Attendance Status
 * @route   GET /api/attendance/today
 * @access  Private (Employee)
 */
export const getTodayStatus = async (req, res) => {
    try {
        const employeeId = req.params.employeeId || req.user.id;

        // Get all sessions for today
        const today = new Date().toISOString().split('T')[0];
        const attendance = await Attendance.find({ employeeId, date: today }).sort({ clockInTime: 1 });

        res.status(200).json({
            success: true,
            count: attendance.length,
            data: attendance
        });
    } catch (error) {
        console.error('Get Today Status Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching today status'
        });
    }
};

/**
 * @desc    Get Employee Attendance History (For Manager)
 * @route   GET /api/attendance/history/:employeeId
 * @access  Private (Manager/Admin)
 */
export const getEmployeeHistory = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const history = await Attendance.find({ employeeId }).sort({ date: -1, clockInTime: -1 });

        // Filter out records older than 7 days (168 hours)
        const now = new Date();
        const refinedHistory = history
            .filter(record => {
                const clockInTime = new Date(record.clockInTime);
                const diffInHours = (now - clockInTime) / (1000 * 60 * 60);
                return diffInHours <= 168;
            })
            .map(record => record.toObject());

        res.status(200).json({
            success: true,
            count: refinedHistory.length,
            data: refinedHistory
        });
    } catch (error) {
        console.error('Get History Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching history'
        });
    }
};

/**
 * @desc    Get Today's Summary (For Manager/Admin)
 * @route   GET /api/attendance/reports/summary-today
 * @access  Private (Manager/Admin)
 */
export const getTodaySummary = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        // Find all sessions for today
        const sessions = await Attendance.find({ date: today })
            .populate('employeeId', 'name designation')
            .sort({ clockInTime: -1 });

        const summary = {
            totalSessions: sessions.length,
            currentlyClockedIn: sessions.filter(s => !s.clockOutTime).length,
            data: sessions
        };

        res.status(200).json({
            success: true,
            data: summary
        });
    } catch (error) {
        console.error('Get Today Summary Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching daily summary'
        });
    }
};
