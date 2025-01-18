import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import compression from 'compression';
// Import routes
import connection from './utils/DbConnection.js';
import Adminauth from './Routes/AdminAuthRoutes.js';
import UpdateData from './Routes/HomeRoutes.js';
import aboutRoutes from './Routes/AboutRoutes.js';
import educationRoutes from './Routes/EducationRoutes.js';
import SkillRoutes from './Routes/SkillsRoutes.js';
import projectRoute from './Routes/ProjectRoutes.js';
import certificateRoutes from './Routes/certificateRoutes.js';
import messageRoutes from './Routes/MessageRoutes.js';
import dashboardRoutes from './Routes/DashboardRoutes.js';
import userDataRoutes from './Routes/UserRoutes/HomegetDataRoutes.js';
import { sessionMiddleware } from './Middleware/SessionMiddleware.js';
import { trackPageView } from './Middleware/TrackPageviewMiddleware.js';
import uploadRoutes from './Routes/UserRoutes/UploadRoutes.js';
import adminViewsRoutes from './Routes/AdminViews.js'
import { globalErrorHandler } from './utils/errorHandler.js';

// Configuration

const app = express();
app.use(compression());
const port = process.env.PORT || 3005;
const databaseurl = process.env.DATABASE_URL;

// ES Module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Middleware
app.use(cors({
  origin: ['https://rudracodes.netlify.app', 'http://rudracodes.netlify.app', 'https://portfolio-backend-93su.onrender.com','http://localhost:5173/'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true,
  allowedHeaders: ['Content-Type', "Authorization"],
  exposedHeaders: ['Content-Disposition']
}));
app.use(cookieParser());
app.use(express.json({ limit: '10kb' }));
app.use(sessionMiddleware);
app.use(trackPageView);
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.set('trust proxy', true);

app.use('/uploads', express.static(path.join(__dirname, './uploads')));

// Separate rate limiters for different routes
const adminLimiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000, // 1 hour
  message: 'Too many admin requests from this IP, please try again in an hour!'
});

const portfolioLimiter = rateLimit({
  max: 300, // Higher limit for portfolio views
  windowMs: 15 * 60 * 1000, // 15 minutes
  message: 'Too many requests from this IP, please try again in 15 minutes!'
});

// Apply stricter rate limiting only to admin routes
app.use('/api/home', adminLimiter);
app.use('/api/about', adminLimiter);
app.use('/api/education', adminLimiter);
app.use('/api/skills', adminLimiter);
app.use('/api/project', adminLimiter);
app.use('/api/certificate', adminLimiter);
app.use('/api/dashboard', adminLimiter);
app.use('/api/messages', adminLimiter);
app.use('/api/upload', adminLimiter);

// Apply more lenient rate limiting to user-facing routes
app.use('/api/user', portfolioLimiter);

// Admin status tracking
let isAdminActive = false;

app.get('/api/admin/active-status', (req, res) => {
  res.json({ isActive: isAdminActive });
});

app.post('/api/admin/login', async (req, res) => {
  // Your existing login logic
  if (loginSuccessful) {
    isAdminActive = true;
    // Rest of your login code
  }
});

app.post('/api/admin/clear-active-status', (req, res) => {
  isAdminActive = false;
  res.json({ success: true });
});

// Routes
app.use('/api/auth', Adminauth);
app.use('/api/home', UpdateData);
app.use('/api/about', aboutRoutes);
app.use('/api/education', educationRoutes);
app.use('/api/skills', SkillRoutes);
app.use('/api/project', projectRoute);
app.use('/api/certificate', certificateRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/user', userDataRoutes);
app.use('/api/upload', UpdateData);
app.use('/api/views',adminViewsRoutes)

// Error handling
app.use(globalErrorHandler);

// Start server
app.listen(port, () => {
  console.log(`server is running on https://localhost:${port}`);
});

// Database connection
connection(databaseurl);
