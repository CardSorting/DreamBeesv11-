/**
 * Model Conventions & Abstraction Layer
 * 
 * Centralizes all model-related identifiers, endpoints, and parameters.
 * This maintains a clean separation between Domain (model IDs) and
 * Infrastructure (backend endpoints).
 * 
 * Joy Zoning Compliance:
 * - Domain: No I/O, no external dependencies
 * - Infrastructure: Constants only, zero business logic
 * - Pure Plumbing: Stateless utility for configuration management
 */

import { MODELS_DB } from './constants.js';

// ==============================================================================
// 1. Model ID Definitions (Domain Layer)
// ==============================================================================

/**
 * Canonical model IDs used throughout the application
 * These are the human-readable identifiers that appear in:
 * - Database (db.collection('models'))
 * - Frontend contexts (ModelContext.tsx)
 * - User-facing routes (/models/{id})
 */
export const MODEL_IDS = {
    // AI Models
    FLUX_KLEIN: 'flux-klein-9b',

    // SDXL Models
    WAI_ILLUSTRIOUS: 'wai-illustrious',
    CHENKIN_NOOB: 'chenkin-noob-xl',
    NOVA_3D: 'nova-3d-cg-xl'
} as const;

// Type alias for model IDs
export type ModelID = (typeof MODEL_IDS)[keyof typeof MODEL_IDS];

// ==============================================================================
// 2. Backend Endpoint Mapping (Infrastructure Layer)
// ==============================================================================

/**
 * Maps frontend-facing MODEL_IDS to their corresponding backend API endpoints.
 * This ensures that domain identifiers are cleanly separated from infrastructure details.
 */
export const MODEL_ENDPOINTS = {
    // Flux Klein
    [MODEL_IDS.FLUX_KLEIN]: 'https://mariecoderinc--flux-klein-9b-v2-flux-fastapi-app.modal.run'
} as const;

/**
 * Type guard: Check if a string is a known MODEL_ID
 */
export function isValidModelId(id: string): id is ModelID {
    return Object.values(MODEL_IDS).includes(id as ModelID);
}

// ==============================================================================
// 3. Generation Parameters (Domain-Specific)
// ==============================================================================

/**
 * Default generation parameters for each model.
 * These are hardcoded values defined by the external model service.
 * 
 * REMARK: Consider extracting to configuration file if values frequently change.
 */
export const MODEL_GENERATION_PARAMS = {
    [MODEL_IDS.FLUX_KLEIN]: {
        defaultSteps: 4,  // Flux Klein Edit uses minimal steps
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
    }
} as const;

/**
 * Get default steps for a model, or fallback to 30
 */
export function getModelDefaultSteps(modelId: string): number {
    const config = MODEL_GENERATION_PARAMS[modelId as keyof typeof MODEL_GENERATION_PARAMS] as any;
    return config?.defaultSteps !== undefined ? config.defaultSteps : 30;
}

/**
 * Safe getter that handles all config types including optional properties
 */
export function getModelGenerationConfig(modelId: string) {
    const config = MODEL_GENERATION_PARAMS[modelId as keyof typeof MODEL_GENERATION_PARAMS] as any;
    return config || null;
}

/**
 * Get generation config for a model, or return defaults
 */
export function getModelConfig(modelId: string) {
    return MODEL_GENERATION_PARAMS[modelId as keyof typeof MODEL_GENERATION_PARAMS];
}

// ==============================================================================
// 4. Model Categories & Costs (Domain Layer)
// ==============================================================================

export const MODEL_CATEGORIES = {
    PREMIUM: ['wai-illustrious'],
    FAST: [],
    STANDARD: ['chenkin-noob-xl', 'flux-2-dev', 'gray-color', 'scyrax-pastel', 'ani-detox', 'animij-v7', 'swijtspot-no1']
} as const;

export const MODEL_COSTS = {
    PREMIUM: 1.0,   // $1.00 per generation
    FAST: 0.5,      // $0.50 per generation
    STANDARD: 0.25  // $0.25 per generation
} as const;

/**
 * Get cost category for a model
 */
export function getModelCost(modelId: string): number {
    if (MODEL_CATEGORIES.PREMIUM.some(id => id === modelId)) return MODEL_COSTS.PREMIUM;
    if (MODEL_CATEGORIES.FAST.some(id => id === modelId)) return MODEL_COSTS.FAST;
    return MODEL_COSTS.STANDARD;
}

// ==============================================================================
// 6. Utility Functions
// ==============================================================================

/**
 * Get the canonical primary model ID for a model family.
 * For example, if someone requests 'zit-model' or 'zit-base-model',
 * we redirect to the most appropriate or fail appropriately.
 * 
 * @param modelId - The requested model ID
 * @returns The canonical model ID or undefined if not found
 */
export function getPrimaryModelId(modelId: string): string | undefined {
    // Map known family models to their primary alternatives
    const familyMap: Record<string, string> = {
        // No current family redirects needed
    };

    return familyMap[modelId];
}

/**
 * Check if a model supports high-quality output
 */
export function modelSupportsHighQuality(modelId: string): boolean {
    return true; // All currently supported models are high quality
}

/**
 * Check if a model requires sequential generation (slower but more reliable)
 */
export function modelRequiresSequentialGeneration(modelId: string): boolean {
    return false; // No current models require sequential generation
}

/**
 * Get endpoint for a model, with fallback
 */
export function getModelEndpoint(modelId: string): string {
    // Default to SDXL A100 endpoint for most models
    const SDXL_ENDPOINT = 'https://mariecoderinc--sdxl-multi-model-a100-omniinferencea100-web.modal.run';
    return MODEL_ENDPOINTS[modelId as keyof typeof MODEL_ENDPOINTS] || SDXL_ENDPOINT;
}

// ==============================================================================
// 7. Migration Helper Functions
// ==============================================================================

/**
 * Convert old model IDs to new canonical IDs.
 * Useful for migrating from older database records.
 */
export function migrateModelId(oldId: string): string {
    const migrations: Record<string, string> = {
        'sdxl_h100': MODEL_IDS.WAI_ILLUSTRIOUS,
        'zit-model': MODEL_IDS.WAI_ILLUSTRIOUS, // Fallback to best available
        'zit-base-model': MODEL_IDS.WAI_ILLUSTRIOUS
    };

    return migrations[oldId] || oldId;
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
    getModelDefaultSteps,
    getModelConfig,
    getModelCost,
    getPrimaryModelId,
    modelSupportsHighQuality,
    modelRequiresSequentialGeneration,
    getModelEndpoint,
    migrateModelId
};
