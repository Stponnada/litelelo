import { Redis } from '@upstash/redis'

// Check if environment variables are present
const redisUrl = process.env.UPSTASH_REDIS_REST_URL
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

// Create a singleton instance
export const redis = (redisUrl && redisToken)
    ? new Redis({
        url: redisUrl,
        token: redisToken,
    })
    : null;

if (!redis) {
    console.warn("⚠️ [Redis] Client is disabled. UPSTASH_REDIS_REST_URL or TOKEN is missing in env.");
}

/**
 * Utility to check if redis is enabled and working
 */
export const isRedisEnabled = () => !!redis
