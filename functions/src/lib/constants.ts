
/**
 * Valid model IDs for the application
 * These are filtered from deprecated models to ensure only active models are used.
 * 
 * Configuration Source: functions/src/lib/modelConventions.ts
 */
export const VALID_MODELS: string[] = [
    'nova-furry-xl', 'perfect-illustrious',
    'gray-color', 'scyrax-pastel', 'ani-detox', 'animij-v7', 'swijtspot-no1',
    'wai-illustrious',
    'rin-anime-blend', 'rin-anime-popcute',
    'crystal-cuteness', 'veretoon-v10',
    'flux-2-dev', 'chenkin-noob-xl',
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
    WAI_ILLUSTRIOUS: 'wai-illustrious',
    CHENKIN_NOOB: 'chenkin-noob-xl',
    NOVA_3D: 'nova-3d-cg-xl',
    Z_IMAGE_TURBO: 'z-image-turbo-a100'
}

export const MODELS_DB = VALID_MODELS;

export const B2_ENDPOINT = process.env.B2_ENDPOINT;
export const B2_REGION = process.env.B2_REGION;
export const B2_BUCKET = process.env.B2_BUCKET;
export const B2_KEY_ID = process.env.B2_KEY_ID;
export const B2_APP_KEY = process.env.B2_APP_KEY;
export const B2_PUBLIC_URL = process.env.B2_PUBLIC_URL;
export const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
export const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

export const ENDPOINTS = {
    flux2dev: "https://api.cloudflare.com/client/v4/accounts/CLOUDFLARE_ACCOUNT_ID/ai/run/@cf/black-forest-labs/flux-1-dev"
};
