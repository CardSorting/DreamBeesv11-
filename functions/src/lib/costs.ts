import { logger } from './utils.js';

export const ZAP_COSTS = {
    // Generation
    IMAGE_GENERATION: 0.5,           // Standard (non-subscriber)
    IMAGE_GENERATION_TURBO: 1.0,     // Turbo Mode
    IMAGE_GENERATION_PREMIUM: 1.0,   // Premium Models (e.g., Z-Image models)

    // Transformation
    IMAGE_ANALYSIS: 0.5,
    IMAGE_ENHANCE: 1.0,
    IMAGE_TRANSFORM: 0.5,

    // Ecommerce & Tools
    MOCKUP_GEN: 0.25,

    // WorkerAI
    WORKER_AI_CHAT: 0.1,             // Synchronous chat (Base/Fixed)
    WORKER_AI_TASK: 0.5,             // Asynchronous Cloud Task
    WORKER_AI_TOKEN_RATE: 0.0001,    // Cost per 1k tokens (0.1 Zaps per 1M tokens)

    // Avatar Forge
    AVATAR_COLLECTION: 5.0,
    AVATAR_MINT: 2.0,

    // Persona
    PERSONA_CHAT: 0.25,
    PERSONA_CREATE: 5.0,
} as const;

export type ZapCostKey = keyof typeof ZAP_COSTS;

// Helper: Calculate Flux Cost
export function calculateFluxCost(aspectRatio: string, steps: number): number {
    const tileMap: Record<string, number> = {
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
    async get(key: ZapCostKey | string): Promise<number> {
        const defaultCost = (ZAP_COSTS as any)[key];
        if (defaultCost === undefined) {
            logger.warn(`[CostManager] Unknown cost key: ${key}, defaulting to 0`);
            return 0;
        }
        return defaultCost;
    }
};
