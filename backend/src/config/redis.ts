import Redis from 'ioredis';
import logger from '../utils/logger.js';

// Redis connection configuration
const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0'),

    // Connection retry strategy
    retryStrategy: (times: number) => {
        if (times > 3) {
            logger.error('Redis connection failed after 3 retries');
            return null; // Stop retrying
        }
        return Math.min(times * 200, 2000); // Retry delay
    },

    // Connection timeout
    connectTimeout: 10000,

    // Enable offline queue (store commands when disconnected)
    enableOfflineQueue: true,

    // Lazy connect (don't connect until first command)
    lazyConnect: true,
};

// Create Redis client
const redis = new Redis(redisConfig);

// Connection status tracking
let isConnected = false;

// Connection event handlers
redis.on('connect', () => {
    logger.info('Redis connected successfully');
    isConnected = true;
});

redis.on('error', (error) => {
    logger.error('Redis connection error', { error: error.message });
    isConnected = false;
});

redis.on('close', () => {
    logger.warn('Redis connection closed');
    isConnected = false;
});

redis.on('reconnecting', () => {
    logger.info('Redis reconnecting...');
});

/**
 * Check if Redis is available
 */
export const isRedisConnected = (): boolean => isConnected;

/**
 * Initialize Redis connection
 */
export const initRedis = async (): Promise<boolean> => {
    try {
        await redis.connect();
        await redis.ping();
        logger.info('Redis initialized and ready');
        return true;
    } catch (error) {
        logger.warn('Redis not available, caching disabled', { error });
        return false;
    }
};

/**
 * Gracefully close Redis connection
 */
export const closeRedis = async (): Promise<void> => {
    try {
        await redis.quit();
        logger.info('Redis connection closed gracefully');
    } catch (error) {
        logger.error('Error closing Redis connection', { error });
    }
};

export default redis;
