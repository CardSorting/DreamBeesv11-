/**
 * Rate Limiter for Vertex AI
 * 
 * Provides exponential backoff retry logic for Vertex AI API calls
 * to handle 429 (quota exhausted) errors gracefully.
 */

import { logger } from "./utils.js";

/**
 * Wraps a function with exponential backoff retry logic for 429 errors.
 * 
 * @param {Function} fn - Async function to execute
 * @param {Object} options - Configuration options
 * @param {number} options.retries - Number of retry attempts (default: 3)
 * @param {number} options.baseDelay - Base delay in ms (default: 20000 = 20s)
 * @param {string} options.context - Context string for logging
 * @returns {Promise<any>} - Result from the function
 */
export async function withVertexRateLimiting(fn, options = {}) {
    const { retries = 3, baseDelay = 20000, context = 'Vertex AI' } = options;

    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            const is429 = error.message?.includes('429') ||
                error.message?.includes('RESOURCE_EXHAUSTED') ||
                error.message?.includes('Too Many Requests');

            if (is429 && attempt < retries - 1) {
                const waitTime = Math.pow(2, attempt) * baseDelay; // 20s, 40s, 80s
                logger.warn(`[${context}] Rate limited (429), waiting ${waitTime / 1000}s before retry ${attempt + 2}/${retries}...`);
                await new Promise(r => setTimeout(r, waitTime));
                continue;
            }

            // Log and rethrow for non-429 errors or final attempt
            if (is429) {
                logger.error(`[${context}] Rate limit exceeded after ${retries} retries`);
            }
            throw error;
        }
    }
}

/**
 * Sleep utility
 * @param {number} ms - Milliseconds to sleep
 */
export const sleep = (ms) => new Promise(r => setTimeout(r, ms));
