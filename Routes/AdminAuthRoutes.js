// routes/adminRoutes.js
import express from 'express';

import rateLimit from 'express-rate-limit';
import { getAdminProfile, login, logout, unlockAccount, verifyOTP } from '../Controller/AdminAuthController.js';
import { logActivity, validateLoginRequest, verifyToken } from '../Middleware/Authatication.js';

const router = express.Router();

// Apply rate limiting to auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: "Too many login attempts, please try again later"
});

// Public routes
router.post('/admin-auth', validateLoginRequest, logActivity, login);
router.post('/admin-auth/verify-otp', authLimiter, logActivity, verifyOTP);
router.post('/admin-auth/unlock-account', authLimiter, logActivity, unlockAccount);

// Protected routes (require authentication)
router.get('/admin-profile', verifyToken, logActivity, getAdminProfile);
router.post('/admin-logout', verifyToken, logActivity, logout);

export default router;