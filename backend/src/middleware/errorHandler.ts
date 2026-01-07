import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';

interface AppError extends Error {
    statusCode?: number;
    isOperational?: boolean;
}

export const errorHandler = (
    err: AppError,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    const requestId = (req as any).requestId || 'unknown';

    // Log error with context
    const errorContext = {
        requestId,
        method: req.method,
        path: req.path,
        statusCode,
        userId: (req as any).user?.userId,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
    };

    if (statusCode >= 500) {
        // Server errors - log full stack
        logger.error(message, { ...errorContext, stack: err.stack });
    } else if (statusCode >= 400) {
        // Client errors - log as warning
        logger.warn(message, errorContext);
    }

    // Don't expose internal errors in production
    const isProduction = process.env.NODE_ENV === 'production';
    const responseMessage = isProduction && statusCode >= 500
        ? 'Internal Server Error'
        : message;

    res.status(statusCode).json({
        error: responseMessage,
        requestId,
        ...(process.env.NODE_ENV === 'development' && {
            stack: err.stack,
            details: message
        }),
    });
};

/**
 * Not found handler for 404 errors
 */
export const notFoundHandler = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const requestId = (req as any).requestId || 'unknown';
    logger.warn(`Route not found: ${req.method} ${req.path}`, { requestId });

    res.status(404).json({
        error: 'Route not found',
        requestId,
    });
};

