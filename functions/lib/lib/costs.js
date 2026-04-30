import { logger } from './utils.js';
export const ZAP_COSTS = {
    // Generation
    IMAGE_GENERATION: 0.5, // Standard (non-subscriber)
    IMAGE_GENERATION_TURBO: 1.0, // Turbo Mode
    IMAGE_GENERATION_PREMIUM: 1.0 // Premium Models
};
// Helper: Calculate Flux Cost
export function calculateFluxCost(aspectRatio, steps) {
    const tileMap = {
        '1:1': 4,
        '2:3': 4,
        '3:2': 4,
        '9:16': 4,
        '16:9': 4
    };
    const tiles = tileMap[aspectRatio] || 4;
    const s = steps || 20;
    return tiles * s * 0.00041;
}
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