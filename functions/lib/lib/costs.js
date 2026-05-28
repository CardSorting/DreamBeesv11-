import { logger } from './utils.js';
export const ZAP_COSTS = {
    // Generation
    IMAGE_GENERATION: 0.5, // Standard (non-subscriber)
    IMAGE_GENERATION_TURBO: 1.0, // Turbo Mode
    IMAGE_GENERATION_PREMIUM: 1.0 // Premium Models
};
/**
 * CostManager
 * Standardized hardcoded pricing for maximum determinism and zero-latency.
 */
export const CostManager = {
    /**
     * Get the cost for a specific key.
     */
    async get(key) {
        const defaultCost = ZAP_COSTS[key];
        if (defaultCost === undefined) {
            logger.warn(`[CostManager] Unknown cost key: ${key}, defaulting to 0`);
            return 0;
        }
        return defaultCost;
    }
};
//# sourceMappingURL=costs.js.map