/**
 * Valid model IDs for the application
 * These are filtered from deprecated models to ensure only active models are used.
 *
 * Configuration Source: functions/src/lib/modelConventions.ts
 */
export const VALID_MODELS = [
    'nova-furry-xl', 'perfect-illustrious',
    'gray-color', 'scyrax-pastel', 'ani-detox', 'animij-v7', 'swijtspot-no1',
    'zit-base-model', 'wai-illustrious', 'flux-klein-9b',
    'rin-anime-blend', 'rin-anime-popcute',
    'crystal-cuteness', 'veretoon-v10',
    'flux-2-dev', 'chenkin-noob-xl',
    'gemini-2.5-flash-image', 'nova-3d-cg-xl',
    'glm-4.7-flash', 'sdxl_h100', 'zit-h100'
];
/**
 * Active models excluding deprecated ones
 * This is the recommended list for production use.
 */
export const ACTIVE_MODELS = VALID_MODELS.filter(modelId => !['flux-klein-4b', 'zit-model'].includes(modelId));
/**
 * Model ID constants for easy reference
 * These are exported here for backward compatibility
 */
export const MODEL_IDS = {
    ZIT_BASE: 'zit-base-model',
    ZIT_TURBO: 'zit-model',
    ZIT: 'zit-h100',
    FLUX_KLEIN: 'flux-klein-9b',
    GEMINI_FLASH: 'gemini-2.5-flash-image',
    WAI_ILLUSTRIOUS: 'wai-illustrious',
    CHENKIN_NOOB: 'chenkin-noob-xl',
    NOVA_3D: 'nova-3d-cg-xl',
    SDXL_H100: 'sdxl_h100'
};
export const AI_CODER_MODEL = '@cf/zai-org/glm-4.7-flash';
export const MODELS_DB = VALID_MODELS;
export const B2_ENDPOINT = process.env.B2_ENDPOINT;
export const B2_REGION = process.env.B2_REGION;
export const B2_BUCKET = process.env.B2_BUCKET;
export const B2_KEY_ID = process.env.B2_KEY_ID;
export const B2_APP_KEY = process.env.B2_APP_KEY;
export const B2_PUBLIC_URL = process.env.B2_PUBLIC_URL;
export const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
export const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
export const MODAL_ENDPOINT = "https://mariecoderinc--flux-klein-9b-v2-flux-fastapi-app.modal.run";
export const ENDPOINTS = {
    flux2dev: "https://api.cloudflare.com/client/v4/accounts/CLOUDFLARE_ACCOUNT_ID/ai/run/@cf/black-forest-labs/flux-1-dev",
    sdxl_a100: "https://mariecoderinc--sdxl-multi-model-a100-omniinferencea100-web.modal.run"
};
//# sourceMappingURL=constants.js.map