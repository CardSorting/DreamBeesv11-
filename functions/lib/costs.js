/**
 * Centralized Zap and Reel costs for backend handlers.
 * Ensure these stay in sync with frontend constants.
 */

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
