import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

declare global {
    namespace Express {
        interface Request {
            requestId?: string;
        }
    }
}

/**
 * Middleware to add unique request ID to each request
 * This helps with tracing and debugging requests across logs
 */
export const requestIdMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    // Use existing request ID from header (for distributed tracing) or generate new one
    const requestId = req.headers['x-request-id'] as string || randomUUID();

    req.requestId = requestId;
    res.setHeader('X-Request-ID', requestId);

    next();
};
