import express from 'express';
import {
    clockIn,
    clockOut,
    getTodayStatus,
    getEmployeeHistory,
    getTodaySummary,
    upload
} from '../controllers/attendanceController.js';
import { protectEmployee, protectManagerOrEmployee } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * GLOBAL ATTENDANCE LOGGER
 * Logs every request that hits this router for debugging
 */
router.use((req, res, next) => {
    console.log(`[ATTENDANCE ROUTE] ${req.method} ${req.originalUrl}`);
    next();
});

/**
 * TEST PING
 * URL: /api/attendance/test-ping
 */
router.get('/test-ping', (req, res) => {
    res.json({ success: true, message: 'Attendance router is LIVE' });
});

// ==========================================
// 1. MANAGER & ADMIN ROUTES (TOP PRIORITY)
// ==========================================

// GET ALL HISTORY FOR AN EMPLOYEE
// Match: /api/attendance/history/:id
router.get('/history/:employeeId', protectManagerOrEmployee, getEmployeeHistory);

// GET DAILY SUMMARY FOR MANAGER
// Match: /api/attendance/reports/summary-today
router.get('/reports/summary-today', protectManagerOrEmployee, getTodaySummary);


// ==========================================
// 2. EMPLOYEE SELF-SERVICE (DAILY ACTIONS)
// ==========================================

// CLOCK IN
// Match: /api/attendance/clock-in/:employeeId
router.post('/clock-in/:employeeId', protectEmployee, upload.single('photo'), clockIn);

// CLOCK OUT
// Match: /api/attendance/clock-out/:employeeId
router.put('/clock-out/:employeeId', protectEmployee, clockOut);

// GET TODAY SESSIONS
// Match: /api/attendance/today/:employeeId
router.get('/today/:employeeId', protectManagerOrEmployee, getTodayStatus);


// ==========================================
// 3. LEGACY & ALIAS ROUTES (FOR COMPATIBILITY)
// ==========================================
router.get('/employee/:employeeId/history', protectManagerOrEmployee, getEmployeeHistory);
router.get('/employee/:employeeId/today', protectEmployee, getTodayStatus);

export default router;
