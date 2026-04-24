import { db } from '../firebaseInit.js';
import { logger } from './utils.js';
export const ZAP_COSTS = {
    // Generation
    IMAGE_GENERATION: 0.5, // Standard (non-subscriber)
    IMAGE_GENERATION_TURBO: 1.0, // Turbo Mode
    IMAGE_GENERATION_PREMIUM: 1.0, // Premium Models (e.g., Z-Image models)
    // Transformation
    IMAGE_ANALYSIS: 0.5,
    IMAGE_ENHANCE: 1.0,
    IMAGE_TRANSFORM: 0.5,
    // Ecommerce & Tools
    MOCKUP_GEN: 0.25,
    // WorkerAI
    WORKER_AI_CHAT: 0.1, // Synchronous chat (Base/Fixed)
    WORKER_AI_TASK: 0.5, // Asynchronous Cloud Task
    WORKER_AI_TOKEN_RATE: 0.0001, // Cost per 1k tokens (0.1 Zaps per 1M tokens)
    // Avatar Forge
    AVATAR_COLLECTION: 5.0,
    AVATAR_MINT: 2.0,
    // Persona
    PERSONA_CHAT: 0.25,
    PERSONA_CREATE: 5.0,
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
 * Handles dynamic pricing overrides from Firestore.
 */
class CostManagerService {
    cache = null;
    lastFetch = 0;
    TTL = 5 * 60 * 1000; // 5 minutes
    async _fetchConfig() {
        const now = Date.now();
        if (this.cache && (now - this.lastFetch < this.TTL)) {
            return this.cache;
        }
        try {
            const [pricingDoc, personaDoc] = await Promise.all([
                db.collection('sys_config').doc('pricing').get(),
                db.collection('sys_config').doc('persona').get()
            ]);
            const pricing = pricingDoc.exists ? pricingDoc.data() : {};
            const personaConfig = personaDoc.exists ? personaDoc.data() : {};
            if (personaConfig.cost_chat !== undefined) {
                pricing.PERSONA_CHAT = Number(personaConfig.cost_chat);
            }
            if (personaConfig.cost_create !== undefined) {
                pricing.PERSONA_CREATE = Number(personaConfig.cost_create);
            }
            this.cache = pricing;
            this.lastFetch = now;
        }
        catch (e) {
            logger.error("[CostManager] Failed to fetch config, using defaults", e);
            this.cache = {};
        }
        return this.cache;
    }
    /**
     * Get the cost for a specific key.
     */
    async get(key) {
        const overrides = await this._fetchConfig();
        const overrideValue = overrides[key];
        if (overrideValue !== undefined && overrideValue !== null) {
            return Number(overrideValue);
        }
        const defaultCost = ZAP_COSTS[key];
        if (defaultCost === undefined) {
            logger.warn(`[CostManager] Unknown cost key: ${key}, defaulting to 0`);
            return 0;
        }
        return defaultCost;
    }
}
export const CostManager = new CostManagerService();
//# sourceMappingURL=costs.js.map