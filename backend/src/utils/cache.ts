import redis, { isRedisConnected } from '../config/redis.js';
import logger from './logger.js';

// Default cache TTL in seconds
const DEFAULT_TTL = 300; // 5 minutes

/**
 * Cache utility for storing and retrieving data from Redis
 * Works gracefully when Redis is not available
 */
export const cache = {
    /**
     * Get cached data by key
     */
    async get<T>(key: string): Promise<T | null> {
        if (!isRedisConnected()) return null;

        try {
            const data = await redis.get(key);
            if (data) {
                logger.debug(`Cache HIT: ${key}`);
                return JSON.parse(data) as T;
            }
            logger.debug(`Cache MISS: ${key}`);
            return null;
        } catch (error) {
            logger.error(`Cache GET error: ${key}`, { error });
            return null;
        }
    },

    /**
     * Set data in cache with optional TTL
     */
    async set(key: string, data: any, ttlSeconds: number = DEFAULT_TTL): Promise<boolean> {
        if (!isRedisConnected()) return false;

        try {
            await redis.setex(key, ttlSeconds, JSON.stringify(data));
            logger.debug(`Cache SET: ${key} (TTL: ${ttlSeconds}s)`);
            return true;
        } catch (error) {
            logger.error(`Cache SET error: ${key}`, { error });
            return false;
        }
    },

    /**
     * Delete cached data by key
     */
    async delete(key: string): Promise<boolean> {
        if (!isRedisConnected()) return false;

        try {
            await redis.del(key);
            logger.debug(`Cache DELETE: ${key}`);
            return true;
        } catch (error) {
            logger.error(`Cache DELETE error: ${key}`, { error });
            return false;
        }
    },

    /**
     * Delete all keys matching a pattern
     * Use with caution in production!
     */
    async deletePattern(pattern: string): Promise<number> {
        if (!isRedisConnected()) return 0;

        try {
            const keys = await redis.keys(pattern);
            if (keys.length > 0) {
                await redis.del(...keys);
                logger.debug(`Cache DELETE pattern: ${pattern} (${keys.length} keys)`);
            }
            return keys.length;
        } catch (error) {
            logger.error(`Cache DELETE pattern error: ${pattern}`, { error });
            return 0;
        }
    },

    /**
     * Clear all cache
     */
    async clear(): Promise<boolean> {
        if (!isRedisConnected()) return false;

        try {
            await redis.flushdb();
            logger.info('Cache cleared');
            return true;
        } catch (error) {
            logger.error('Cache CLEAR error', { error });
            return false;
        }
    },

    /**
     * Get or set cache (fetch from source if not cached)
     */
    async getOrSet<T>(
        key: string,
        fetchFn: () => Promise<T>,
        ttlSeconds: number = DEFAULT_TTL
    ): Promise<T> {
        // Try to get from cache first
        const cached = await this.get<T>(key);
        if (cached !== null) {
            return cached;
        }

        // Fetch from source
        const data = await fetchFn();

        // Store in cache (don't await, fire and forget)
        this.set(key, data, ttlSeconds);

        return data;
    }
};

/**
 * Cache key generators for consistent naming
 */
export const cacheKeys = {
    user: (id: string) => `user:${id}`,
    userList: () => 'users:list',
    assignment: (id: string) => `assignment:${id}`,
    assignmentList: () => 'assignments:list',
    assignmentsByBatch: (batchId: string) => `assignments:batch:${batchId}`,
    paper: (id: string) => `paper:${id}`,
    papersByStudent: (userId: string) => `papers:student:${userId}`,
    dashboard: (role: string) => `dashboard:${role}`,
    dashboardStats: () => 'dashboard:stats',
    batch: (id: string) => `batch:${id}`,
    batchList: () => 'batches:list',
    grades: (paperId: string) => `grades:paper:${paperId}`,
};

/**
 * Cache TTL values in seconds
 */
export const cacheTTL = {
    SHORT: 60,          // 1 minute
    MEDIUM: 300,        // 5 minutes
    LONG: 900,          // 15 minutes
    VERY_LONG: 3600,    // 1 hour
    DAY: 86400,         // 24 hours
};
