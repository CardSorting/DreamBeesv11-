/**
 * Valid model IDs for the application
 * These are filtered from deprecated models to ensure only active models are used.
 *
 * Configuration Source: functions/src/lib/modelConventions.ts
 */
export const VALID_MODELS = [
    'nova-furry-xl', 'perfect-illustrious',
    'gray-color', 'scyrax-pastel', 'ani-detox', 'animij-v7', 'swijtspot-no1',
    'wai-illustrious',
    'rin-anime-blend', 'rin-anime-popcute',
    'crystal-cuteness', 'veretoon-v10',
    'chenkin-noob-xl',
    'nova-3d-cg-xl', 'z-image-turbo-a100'
];
/**
 * Active models excluding deprecated ones
 * This is the recommended list for production use.
 */
export const ACTIVE_MODELS = [...VALID_MODELS];
/**
 * Model ID constants for easy reference
 * These are exported here for backward compatibility
 */
export const MODEL_IDS = {
    NOVA_FURRY: 'nova-furry-xl',
    PERFECT_ILLUSTRIOUS: 'perfect-illustrious',
    GRAY_COLOR: 'gray-color',
    SCYRAX_PASTEL: 'scyrax-pastel',
    ANI_DETOX: 'ani-detox',
    ANIMIJ_V7: 'animij-v7',
    SWIJTSPOT_NO1: 'swijtspot-no1',
    WAI_ILLUSTRIOUS: 'wai-illustrious',
    RIN_ANIME_BLEND: 'rin-anime-blend',
    RIN_ANIME_POPCUTE: 'rin-anime-popcute',
    CRYSTAL_CUTENESS: 'crystal-cuteness',
    VERETOON_V10: 'veretoon-v10',
    CHENKIN_NOOB: 'chenkin-noob-xl',
    NOVA_3D: 'nova-3d-cg-xl',
    Z_IMAGE_TURBO: 'z-image-turbo-a100'
};
export const MODELS_DB = VALID_MODELS;
export const B2_ENDPOINT = process.env.B2_ENDPOINT;
export const B2_REGION = process.env.B2_REGION;
export const B2_BUCKET = process.env.B2_BUCKET;
export const B2_KEY_ID = process.env.B2_KEY_ID;
export const B2_APP_KEY = process.env.B2_APP_KEY;
export const B2_PUBLIC_URL = process.env.B2_PUBLIC_URL;
//# sourceMappingURL=constants.js.map