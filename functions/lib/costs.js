/**
 * Centralized Zap and Reel costs for backend handlers.
 * Ensure these stay in sync with frontend constants.
 */
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from './utils.js';

export const ZAP_COSTS = {
    // Generation
    IMAGE_GENERATION: 0.5,           // Standard (non-subscriber)
    IMAGE_GENERATION_TURBO: 1.0,     // Turbo Mode
    IMAGE_GENERATION_PREMIUM: 1.0,   // Premium Models (e.g. ZIT)

    DRESS_UP: 0.5,
    SLIDESHOW: 3.0,
    POSTER: 0.5,
    VIDEO_PROMPT: 1.0,

    // Transformation
    IMAGE_ANALYSIS: 0.5,
    IMAGE_ENHANCE: 1.0,
    IMAGE_TRANSFORM: 0.5,            // Gemini-based transformation
    MEOWACC: 0.5,

    // Ecommerce & Tools
    AUTO_CSV_IMAGE: 0.25,
    MEME_FORMAT: 0.25,
    MOCKUP_GEN: 0.25,

    // ColorCraft
    BOOK_CONCEPTS: 0.5,
    COLORING_PAGE: 1.0,

    // Avatar Forge
    AVATAR_COLLECTION: 5.0,
    AVATAR_MINT: 2.0,

    // Persona
    PERSONA_CHAT: 0.25,
    PERSONA_CREATE: 5.0,
};


export const REEL_COSTS = {
    VIDEO_4K: 50,
    VIDEO_2K: 26,
    VIDEO_SD: 12,
};

// Helper: Calculate Flux Cost
export function calculateFluxCost(aspectRatio, steps) {
    const tileMap = {
        '1:1': 4, // 1024x1024
        '2:3': 4, // 832x1216 ~4
        '3:2': 4,
        '9:16': 4,
        '16:9': 4
    };

    const tiles = tileMap[aspectRatio] || 4;
    const s = steps || 20;

    // $0.00041 per tile per step
    return tiles * s * 0.00041;
}

/**
 * CostManager
 * Handles dynamic pricing overrides from Firestore.
 * Caches config for performance (TTL: 5 minutes).
 */
class CostManagerService {
    constructor() {
        this.cache = null;
        this.lastFetch = 0;
        this.TTL = 5 * 60 * 1000; // 5 minutes
    }

    async _fetchConfig() {
        const now = Date.now();
        if (this.cache && (now - this.lastFetch < this.TTL)) {
            return this.cache;
        }

        try {
            const db = getFirestore();
            // Fetch centralized pricing AND legacy persona config in parallel
            const [pricingDoc, personaDoc] = await Promise.all([
                db.collection('sys_config').doc('pricing').get(),
                db.collection('sys_config').doc('persona').get()
            ]);

            const pricing = pricingDoc.exists ? pricingDoc.data() : {};
            const personaConfig = personaDoc.exists ? personaDoc.data() : {};

            // Map legacy persona keys to ZAP_COSTS keys format if needed
            // Legacy persona config uses 'cost_chat', 'cost_create'
            // We want to map them to 'PERSONA_CHAT', 'PERSONA_CREATE'
            if (personaConfig.cost_chat !== undefined) { pricing.PERSONA_CHAT = Number(personaConfig.cost_chat); }
            if (personaConfig.cost_create !== undefined) { pricing.PERSONA_CREATE = Number(personaConfig.cost_create); }

            this.cache = pricing;
            this.lastFetch = now;
            // logger.info("[CostManager] Config refreshed", this.cache);
        } catch (e) {
            logger.error("[CostManager] Failed to fetch config, using defaults", e);
            this.cache = {}; // Fallback to empty overrides
        }
        return this.cache;
    }

    /**
     * Get the cost for a specific key.
     * @param {keyof typeof ZAP_COSTS} key 
     * @returns {Promise<number>}
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
