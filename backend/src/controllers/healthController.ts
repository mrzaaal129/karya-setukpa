import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import logger from '../utils/logger.js';

interface HealthStatus {
    status: 'healthy' | 'degraded' | 'unhealthy';
    database: {
        status: 'connected' | 'disconnected';
        latencyMs?: number;
    };
    uptime: number;
    timestamp: string;
    version: string;
    environment: string;
}

/**
 * Comprehensive health check endpoint
 */
export const healthCheck = async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();

    const health: HealthStatus = {
        status: 'healthy',
        database: {
            status: 'disconnected',
        },
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
    };

    try {
        // Check database connectivity
        const dbStart = Date.now();
        await prisma.$queryRaw`SELECT 1`;
        const dbLatency = Date.now() - dbStart;

        health.database = {
            status: 'connected',
            latencyMs: dbLatency,
        };

        // Warn if database is slow
        if (dbLatency > 1000) {
            health.status = 'degraded';
            logger.warn('Database latency is high', { latencyMs: dbLatency });
        }

    } catch (error) {
        health.status = 'unhealthy';
        health.database.status = 'disconnected';
        logger.error('Database health check failed', { error });
    }

    const statusCode = health.status === 'healthy' ? 200 :
        health.status === 'degraded' ? 200 : 503;

    res.status(statusCode).json(health);
};

/**
 * Simple liveness probe (for Kubernetes)
 */
export const livenessProbe = (req: Request, res: Response): void => {
    res.status(200).json({ status: 'alive' });
};

/**
 * Readiness probe - checks if app can serve traffic
 */
export const readinessProbe = async (req: Request, res: Response): Promise<void> => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.status(200).json({ status: 'ready' });
    } catch (error) {
        res.status(503).json({ status: 'not ready', error: 'Database unavailable' });
    }
};
