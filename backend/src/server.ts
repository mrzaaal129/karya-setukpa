import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { apiLimiter, authLimiter } from './middleware/rateLimiter.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import logger from './utils/logger.js';
import { initRedis, closeRedis } from './config/redis.js';
import path from 'path';

// Import routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import assignmentRoutes from './routes/assignmentRoutes.js';
import paperRoutes from './routes/paperRoutes.js';
import templateRoutes from './routes/templateRoutes.js';
import gradeRoutes from './routes/gradeRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import batchRoutes from './routes/batchRoutes.js';
import userImportRoutes from './routes/userImportRoutes.js';
import advisorRoutes from './routes/advisorRoutes.js';
import examinerRoutes from './routes/examinerRoutes.js';
import advisorAssignmentRoutes from './routes/advisorAssignmentRoutes.js';
import examinerAssignmentRoutes from './routes/examinerAssignmentRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import wopiRoutes from './routes/wopiRoutes.js';
import chapterRoutes from './routes/chapterRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import systemRoutes from './routes/systemRoutes.js';
import violationRoutes from './routes/violationRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import healthRoutes from './routes/healthRoutes.js';

const app = express();

// ============================================
// Security Middleware
// ============================================

// Helmet - Security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "blob:"],
        },
    },
    crossOriginEmbedderPolicy: false, // Required for loading external images
}));

// Request ID for tracing
app.use(requestIdMiddleware);

// CORS configuration
app.use(cors({
    origin: config.cors.origin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting - Apply to all API routes
app.use('/api', apiLimiter);

// Stricter rate limiting for auth endpoints
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Body parsing with reasonable limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// Static Files
// ============================================
const uploadDir = path.join(process.cwd(), 'uploads');
logger.info(`Serving static files from: ${uploadDir}`);

app.use('/uploads', (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Cross-Origin-Resource-Policy", "cross-origin");
    next();
}, express.static(uploadDir));

// ============================================
// Health Check Routes
// ============================================
app.use('/', healthRoutes);

// ============================================
// API Routes
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/papers', paperRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/users-import', userImportRoutes);
app.use('/api/advisors', advisorRoutes);
app.use('/api/examiners', examinerRoutes);
app.use('/api/advisor-assignment', advisorAssignmentRoutes);
app.use('/api/examiner-assignment', examinerAssignmentRoutes);
app.use('/api', documentRoutes); // OnlyOffice document routes
app.use('/api', wopiRoutes); // Collabora WOPI routes
app.use('/api/assignments', chapterRoutes); // Chapter management routes
app.use('/api/notifications', notificationRoutes); // Notification routes
app.use('/api/settings', systemRoutes); // System settings routes
app.use('/api/violations', violationRoutes); // Violation routes
app.use('/api/reports', reportRoutes); // Report routes

// ============================================
// Error Handling
// ============================================

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// ============================================
// Server Startup
// ============================================
const PORT = config.port;
const server = app.listen(PORT, async () => {
    logger.info(`🚀 SETUKPA Backend API running on port ${PORT}`);
    logger.info(`📝 Environment: ${config.nodeEnv}`);
    logger.info(`🌐 CORS enabled for: ${config.cors.origin}`);
    logger.info(`📡 API Base URL: http://localhost:${PORT}/api`);
    logger.info(`🛡️  Security: Helmet enabled, Rate limiting active`);

    // Initialize Redis (optional - works without it)
    const redisReady = await initRedis();
    if (redisReady) {
        logger.info(`💾 Redis: Connected and caching enabled`);
    } else {
        logger.warn(`💾 Redis: Not available, caching disabled`);
    }
});

// ============================================
// Graceful Shutdown
// ============================================
const gracefulShutdown = async () => {
    logger.info('Shutting down gracefully...');

    // Close Redis connection
    await closeRedis();

    server.close(() => {
        logger.info('Server closed');
        process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
        logger.error('Forced shutdown due to timeout');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

export default app;


