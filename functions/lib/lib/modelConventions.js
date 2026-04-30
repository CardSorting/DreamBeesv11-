/**
 * Model Conventions & Abstraction Layer
 *
 * Centralizes all model-related identifiers, endpoints, and parameters.
 */
// ==============================================================================
// 1. Model ID Definitions (Domain Layer)
// ==============================================================================
export const MODEL_IDS = {
    FLUX_KLEIN: 'flux-klein-9b',
    WAI_ILLUSTRIOUS: 'wai-illustrious',
    CHENKIN_NOOB: 'chenkin-noob-xl',
    NOVA_3D: 'nova-3d-cg-xl',
    Z_IMAGE_TURBO: 'z-image-turbo-a100'
};
// ==============================================================================
// 2. Backend Endpoint Mapping (Infrastructure Layer)
// ==============================================================================
export const MODEL_ENDPOINTS = {
    [MODEL_IDS.FLUX_KLEIN]: 'https://mariecoderinc--flux-klein-9b-v2-flux-fastapi-app.modal.run',
    [MODEL_IDS.Z_IMAGE_TURBO]: 'https://mariecoderinc--zit-a100-stable-fastapi-app.modal.run'
};
export function isValidModelId(id) {
    return Object.values(MODEL_IDS).includes(id);
}
// ==============================================================================
// 3. Generation Parameters (Domain-Specific)
// ==============================================================================
export const MODEL_GENERATION_PARAMS = {
    [MODEL_IDS.FLUX_KLEIN]: {
        defaultSteps: 4,
        cfg: 7.5,
        width: 1024,
        height: 1024
    },
    [MODEL_IDS.WAI_ILLUSTRIOUS]: {
        hiresFix: true
    },
    [MODEL_IDS.CHENKIN_NOOB]: {
        defaultSteps: 25,
        cfg: 4.0,
        scheduler: 'Euler a'
    },
    [MODEL_IDS.NOVA_3D]: {
        hiresFix: true,
        qualityTags: ", 3d render, cgi, masterwork, ultra detailed, cinematic lighting"
    },
    [MODEL_IDS.Z_IMAGE_TURBO]: {
        defaultSteps: 8,
        maxSteps: 9
    }
};
// ==============================================================================
// 4. Model Categories & Costs (Domain Layer)
// ==============================================================================
export const MODEL_CATEGORIES = {
    PREMIUM: ['wai-illustrious'],
    FAST: ['z-image-turbo-a100'],
    STANDARD: ['chenkin-noob-xl', 'flux-2-dev', 'gray-color', 'scyrax-pastel', 'ani-detox', 'animij-v7', 'swijtspot-no1']
};
export const MODEL_COSTS = {
    PREMIUM: 1.0,
    FAST: 0.5,
    STANDARD: 0.25
};
export function getModelCost(modelId) {
    if (MODEL_CATEGORIES.PREMIUM.some(id => id === modelId))
        return MODEL_COSTS.PREMIUM;
    if (MODEL_CATEGORIES.FAST.some(id => id === modelId))
        return MODEL_COSTS.FAST;
    return MODEL_COSTS.STANDARD;
}
// ==============================================================================
// 6. Utility Functions
// ==============================================================================
export function getModelEndpoint(modelId) {
    const SDXL_ENDPOINT = 'https://mariecoderinc--sdxl-multi-model-a100-omniinferencea100-web.modal.run';
    return MODEL_ENDPOINTS[modelId] || SDXL_ENDPOINT;
}
// ==============================================================================
// Export everything for easy importing
// ==============================================================================
export default {
    MODEL_IDS,
    MODEL_ENDPOINTS,
    MODEL_GENERATION_PARAMS,
    MODEL_CATEGORIES,
    MODEL_COSTS,
    isValidModelId,
    getModelCost,
    getModelEndpoint
};
//# sourceMappingURL=modelConventions.js.map