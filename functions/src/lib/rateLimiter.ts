import { logger } from "./utils.js";

interface RateLimitOptions {
    retries?: number;
    baseDelay?: number;
    context?: string;
}

/**
 * Wraps a function with exponential backoff retry logic for 429 errors.
 */
export async function withVertexRateLimiting<T>(fn: () => Promise<T>, options: RateLimitOptions = {}): Promise<T> {
    const { retries = 3, baseDelay = 5000, context = 'Vertex AI' } = options;

    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            return await fn();
        } catch (error: any) {
            const is429 = error.message?.includes('429') ||
                error.message?.includes('RESOURCE_EXHAUSTED') ||
                error.message?.includes('Too Many Requests');

            if (is429 && attempt < retries - 1) {
                const waitTime = Math.pow(2, attempt) * baseDelay;
                logger.warn(`[${context}] Rate limited (429), waiting ${waitTime / 1000}s before retry ${attempt + 2}/${retries}...`);
                await new Promise(r => setTimeout(r, waitTime));
                continue;
            }

            if (is429) {
                logger.error(`[${context}] Rate limit exceeded after ${retries} retries`, null);
            }
            throw error;
        }
    }
    throw new Error(`[${context}] Function failed to execute after ${retries} attempts`);
}

/**
 * Sleep utility
 */
export const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));
