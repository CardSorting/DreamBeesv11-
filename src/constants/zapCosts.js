export const ZAP_COSTS = {
    // Basic Actions
    IMAGE_GENERATION: 0.5,
    IMAGE_GENERATION_TURBO: 1.0,
    IMAGE_GENERATION_PREMIUM: 1.0,
    IMAGE_ANALYSIS: 0.5,
    IMAGE_ENHANCE: 1.0,
    IMAGE_TRANSFORM: 0.5,
    MEOWACC: 0.5,
    DRESS_UP: 0.5,
    SLIDESHOW: 3.0,
    BOOK_CONCEPTS: 0.5,
    AUTO_CSV_IMAGE: 0.25,
    MEME_FORMAT: 0.25,
    COLORING_PAGE: 1.0,
    AVATAR_COLLECTION: 5.0,
    AVATAR_MINT: 2.0,

    // Limits
    FREE_GENERATIONS_LIMIT: 5,
};

/**
 * Calculates the final Zap cost based on user status and action parameters.
 * Mirrors the logic in Cloud Functions (functions/lib/costs.js)
 */
export const calculateZapCost = (action, options = {}) => {
    const {
        subscriptionStatus = 'inactive',
        modelId = '',
        useTurbo = false
    } = options;

    const isSubscribed = subscriptionStatus === 'active';

    switch (action) {
        case 'IMAGE_GENERATION':
            if (modelId === 'galmix') return 0;
            if (modelId === 'zit-model' || modelId === 'zit-base-model') return ZAP_COSTS.IMAGE_GENERATION_PREMIUM;
            if (useTurbo) return ZAP_COSTS.IMAGE_GENERATION_TURBO;
            // Standard models are free for subscribers
            return isSubscribed ? 0 : ZAP_COSTS.IMAGE_GENERATION;

        default:
            return ZAP_COSTS[action] || 0;
    }
};

export const formatZaps = (amount) => {
    if (typeof amount !== 'number') return '0';
    // Show up to 2 decimals if needed (for 0.25), but strip trailing zeros
    return Number(amount.toFixed(2)).toString();
};
