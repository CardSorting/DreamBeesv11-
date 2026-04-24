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
    // Z-Image Family
    ZIT_BASE: 'zit-base-model',   // High-quality base model (28 steps)
    ZIT_TURBO: 'zit-model',       // Fast generation model (9 steps)
    ZIT: 'zit-h100',              // Implementation identifier for route shortcuts
    
    // AI Models
    FLUX_KLEIN: 'flux-klein-9b',
    GEMINI_FLASH: 'gemini-2.5-flash-image',
    
    // SDXL Models
    WAI_ILLUSTRIOUS: 'wai-illustrious',
    CHENKIN_NOOB: 'chenkin-noob-xl',
    NOVA_3D: 'nova-3d-cg-xl',
    
    // Special Models
    SDXL_H100: 'sdxl_h100',
    GEAR: 'gear-tool',
    NEKOMIMI: 'nekomimi'
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
    // Z-Image Family
    [MODEL_IDS.ZIT_BASE]: 'https://mariecoderinc--zit-a100-base-omniinferencea100-web.modal.run',
    [MODEL_IDS.ZIT_TURBO]: 'https://mariecoderinc--zit-a100-omniinferencea100-web.modal.run',
    [MODEL_IDS.ZIT]: 'https://mariecoderinc--zit-a100-omniinferencea100-web.modal.run',
    
    // SDXL Models
    [MODEL_IDS.SDXL_H100]: 'https://mariecoderinc--sdxl-multi-model-a100-omniinferencea100-web.modal.run',
    
    // Flux Klein
    [MODEL_IDS.FLUX_KLEIN]: 'https://mariecoderinc--flux-klein-9b-flux-fastapi-app.modal.run'
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
    [MODEL_IDS.ZIT_BASE]: {
        defaultSteps: 28,
        cfg: 7,
        scheduler: 'DPM++ 2M Karras'
    },
    [MODEL_IDS.ZIT_TURBO]: {
        defaultSteps: 9,
        cfg: 7,
        scheduler: 'DPM++ 2M Karras'
    },
    [MODEL_IDS.FLUX_KLEIN]: {
        defaultSteps: 4,  // Flux Klein Edit uses minimal steps
        cfg: 7.5,
        width: 1024,
        height: 1024
    },
    [MODEL_IDS.GEMINI_FLASH]: {
        defaultSteps: 25,
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
    PREMIUM: ['zit-model', 'zit-base-model', 'sdxl_h100', 'wai-illustrious'],
    FAST: ['gemini-2.5-flash-image'],
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
// 5. Deprecated Models (Infrastructural Safety)
// ==============================================================================

/**
 * Array of models that have been deprecated but may still exist in the database.
 * These should be soft-removed from VALID_MODELS and replaced with upgraded alternatives.
 */
export const DEPRECATED_MODELS = [
    'zit-model',      // New baseline: use zit-base-model for quality or test turbo separately
    'flux-klein-4b'   // Marked as blocked in some contexts
] as const;

/**
 * Check if a model is deprecated
 */
export function isModelDeprecated(modelId: string): boolean {
    return (DEPRECATED_MODELS as readonly string[]).includes(modelId);
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
        'zit-model': MODEL_IDS.ZIT_BASE,         // Use base model as default
        'zit-h100': MODEL_IDS.ZIT_BASE,          // Alias
        'sdxl_h100': MODEL_IDS.WAI_ILLUSTRIOUS   // Frontend ID maps to backend ID
    };
    
    return familyMap[modelId];
}

/**
 * Check if a model supports high-quality output
 */
export function modelSupportsHighQuality(modelId: string): boolean {
    const lowQualityModels = ['gemini-2.5-flash-image'];
    return !lowQualityModels.includes(modelId);
}

/**
 * Check if a model requires sequential generation (slower but more reliable)
 */
export function modelRequiresSequentialGeneration(modelId: string): boolean {
    const sequentialModels = ['zit-base-model']; // Last-generation confirmed models
    return sequentialModels.includes(modelId);
}

/**
 * Get endpoint for a model, with fallback
 */
export function getModelEndpoint(modelId: string): string {
    return MODEL_ENDPOINTS[modelId] || MODEL_ENDPOINTS[MODEL_IDS.SDXL_H100];
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
        'zit-model': MODEL_IDS.ZIT_BASE,
        'zit_h100': MODEL_IDS.ZIT_BASE,
        'zit_a10g': MODEL_IDS.ZIT_BASE,
        'zit_base': MODEL_IDS.ZIT_BASE
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
    DEPRECATED_MODELS,
    isValidModelId,
    getModelDefaultSteps,
    getModelConfig,
    getModelCost,
    isModelDeprecated,
    getPrimaryModelId,
    modelSupportsHighQuality,
    modelRequiresSequentialGeneration,
    getModelEndpoint,
    migrateModelId
};
