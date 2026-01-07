import { Response } from 'express';

export interface ApiError {
    error: string;
    message?: string;
    details?: any;
    code?: string;
}

export class ErrorResponse {
    /**
     * Send a standardized error response
     */
    static send(res: Response, statusCode: number, error: string, details?: any, code?: string): void {
        const response: ApiError = {
            error,
            ...(details && { details }),
            ...(code && { code }),
        };

        res.status(statusCode).json(response);
    }

    /**
     * 400 Bad Request
     */
    static badRequest(res: Response, message: string, details?: any): void {
        this.send(res, 400, message, details, 'BAD_REQUEST');
    }

    /**
     * 401 Unauthorized
     */
    static unauthorized(res: Response, message: string = 'Unauthorized'): void {
        this.send(res, 401, message, undefined, 'UNAUTHORIZED');
    }

    /**
     * 403 Forbidden
     */
    static forbidden(res: Response, message: string = 'Forbidden'): void {
        this.send(res, 403, message, undefined, 'FORBIDDEN');
    }

    /**
     * 404 Not Found
     */
    static notFound(res: Response, message: string = 'Resource not found'): void {
        this.send(res, 404, message, undefined, 'NOT_FOUND');
    }

    /**
     * 409 Conflict
     */
    static conflict(res: Response, message: string, details?: any): void {
        this.send(res, 409, message, details, 'CONFLICT');
    }

    /**
     * 422 Unprocessable Entity (Validation Error)
     */
    static validationError(res: Response, message: string, details?: any): void {
        this.send(res, 422, message, details, 'VALIDATION_ERROR');
    }

    /**
     * 500 Internal Server Error
     */
    static internalError(res: Response, message: string = 'Internal server error', error?: Error): void {
        // Log the actual error for debugging
        if (error) {
            console.error('Internal Server Error:', error);
            console.error('Stack:', error.stack);
        }

        // Don't expose internal error details to client in production
        const details = process.env.NODE_ENV === 'development' && error
            ? { message: error.message, stack: error.stack }
            : undefined;

        this.send(res, 500, message, details, 'INTERNAL_ERROR');
    }
}

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export const asyncHandler = (fn: Function) => {
    return (req: any, res: Response, next: Function) => {
        Promise.resolve(fn(req, res, next)).catch((error) => {
            console.error('Async handler error:', error);
            ErrorResponse.internalError(res, 'An unexpected error occurred', error);
        });
    };
};
