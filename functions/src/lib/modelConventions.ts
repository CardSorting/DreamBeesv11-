/**
 * Model Conventions & Abstraction Layer
 * 
 * Centralizes all model-related identifiers, endpoints, and parameters.
 */

import { MODELS_DB } from './constants.js';

// ==============================================================================
// 1. Model ID Definitions (Domain Layer)
// ==============================================================================

export const MODEL_IDS = {
    NOVA_FURRY: 'nova-furry-xl',
    SCYRAX_PASTEL: 'scyrax-pastel',
    ANI_DETOX: 'ani-detox',
    WAI_ILLUSTRIOUS: 'wai-illustrious',
    RIN_ANIME_BLEND: 'rin-anime-blend',
    RIN_ANIME_POPCUTE: 'rin-anime-popcute',
    CRYSTAL_CUTENESS: 'crystal-cuteness',
    VERETOON_V10: 'veretoon-v10',
    NOVA_3D: 'nova-3d-cg-xl',
    Z_IMAGE_TURBO: 'z-image-turbo-a100'
} as const;

export type ModelID = (typeof MODEL_IDS)[keyof typeof MODEL_IDS];

// ==============================================================================
// 2. Backend Endpoint Mapping (Infrastructure Layer)
// ==============================================================================

export const MODEL_ENDPOINTS = {
    [MODEL_IDS.Z_IMAGE_TURBO]: 'https://mariecoderinc--zit-a100-stable-fastapi-app.modal.run'
} as const;

export function isValidModelId(id: string): id is ModelID {
    return Object.values(MODEL_IDS).includes(id as ModelID);
}

// ==============================================================================
// 3. Generation Parameters (Domain-Specific)
// ==============================================================================

export const MODEL_GENERATION_PARAMS = {
    [MODEL_IDS.WAI_ILLUSTRIOUS]: {
        hiresFix: true
    },
    [MODEL_IDS.NOVA_3D]: {
        hiresFix: true,
        qualityTags: ", 3d render, cgi, masterwork, ultra detailed, cinematic lighting"
    },
    [MODEL_IDS.Z_IMAGE_TURBO]: {
        defaultSteps: 8,
        maxSteps: 9
    }
} as const;

// ==============================================================================
// 4. Model Categories & Costs (Domain Layer)
// ==============================================================================

export const MODEL_CATEGORIES = {
    PREMIUM: ['wai-illustrious', 'nova-3d-cg-xl'],
    FAST: ['z-image-turbo-a100'],
    STANDARD: [
        'nova-furry-xl',
        'scyrax-pastel',
        'ani-detox',
        'rin-anime-blend',
        'rin-anime-popcute',
        'crystal-cuteness',
        'veretoon-v10'
    ]
} as const;

export const MODEL_COSTS = {
    PREMIUM: 1.0,
    FAST: 0.5,
    STANDARD: 0.25
} as const;

export function getModelCost(modelId: string): number {
    if (MODEL_CATEGORIES.PREMIUM.some(id => id === modelId)) return MODEL_COSTS.PREMIUM;
    if (MODEL_CATEGORIES.FAST.some(id => id === modelId)) return MODEL_COSTS.FAST;
    return MODEL_COSTS.STANDARD;
}

// ==============================================================================
// 6. Utility Functions
// ==============================================================================

export function getModelEndpoint(modelId: string): string {
    const SDXL_ENDPOINT = 'https://mariecoderinc--sdxl-multi-model-a100-omniinferencea100-web.modal.run';
    return MODEL_ENDPOINTS[modelId as keyof typeof MODEL_ENDPOINTS] || SDXL_ENDPOINT;
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
