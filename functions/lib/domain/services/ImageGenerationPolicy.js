/**
 * Domain Service: Image Generation Policy
 * Pure business logic for model-specific generation rules and constraints
 * No I/O, no external dependencies
 */
export class ImageGenerationPolicy {
    /**
     * Get resolution dimensions for given aspect ratio
     */
    static getResolution(aspectRatio) {
        const map = {
            '1:1': { width: 1024, height: 1024 },
            '2:3': { width: 832, height: 1216 },
            '3:2': { width: 1216, height: 832 },
            '9:16': { width: 768, height: 1344 },
            '16:9': { width: 1344, height: 768 }
        };
        return map[aspectRatio] || map['1:1'];
    }
    /**
     * Apply model-specific quality tags to prompt
     * Returns modified prompt if needed
     */
    static applyModelQualityTags(prompt, modelId) {
        // No quality tags needed for default models
        if (!this.requiresQualityTags(modelId)) {
            return prompt;
        }
        // nova-3d-cg-xl requires specific quality tags
        if (modelId === 'nova-3d-cg-xl') {
            const qualityTags = ", 3d render, cgi, masterwork, ultra detailed, cinematic lighting";
            if (!this.normalizeForRegex(prompt.toLowerCase()).includes('3d render')) {
                return prompt + qualityTags;
            }
        }
        return prompt;
    }
    /**
     * Get default steps for model
     */
    static getDefaultSteps(modelId) {
        switch (modelId) {
            case 'chenkin-noob-xl':
                return 25;
            case 'flux-2-dev':
                return 25;
            default:
                return 30;
        }
    }
    /**
     * Get default CFG scale for model
     */
    static getDefaultCFG(modelId) {
        switch (modelId) {
            case 'chenkin-noob-xl':
                return 4.0;
            case 'flux-klein-9b':
                return 7.0;
            default:
                return 7.0;
        }
    }
    /**
     * Get default scheduler for model
     */
    static getDefaultScheduler(modelId) {
        switch (modelId) {
            case 'chenkin-noob-xl':
                return 'Euler a';
            case 'wai-illustrious':
            case 'sdxl_h100':
            case 'flux-2-dev':
                return 'DPM++ 2M Karras';
            case 'nova-3d-cg-xl':
                return 'Euler a';
            default:
                return 'DPM++ 2M Karras';
        }
    }
    /**
     * Check if model requires hires fix
     */
    static requiresHiresFix(modelId) {
        switch (modelId) {
            case 'wai-illustrious':
            case 'nova-3d-cg-xl':
                return true;
            default:
                return false;
        }
    }
    /**
     * Check if model requires quality tag adjustments
     */
    static requiresQualityTags(modelId) {
        return modelId === 'nova-3d-cg-xl';
    }
    /**
     * Check if model supports image editing (I2I)
     */
    static supportsImageEditing(modelId) {
        return modelId === 'flux-klein-9b';
    }
    /**
     * Get model-specific defaults for generation parameters
     */
    static getModelDefaults(modelId) {
        const defaultSteps = this.getDefaultSteps(modelId);
        const defaultCFG = this.getDefaultCFG(modelId);
        const defaultScheduler = this.getDefaultScheduler(modelId);
        return {
            steps: defaultSteps,
            cfg: defaultCFG,
            scheduler: defaultScheduler,
            hiresFix: this.requiresHiresFix(modelId),
            qualityTags: this.requiresQualityTags(modelId)
        };
    }
    /**
     * Get max steps allowed for model
     */
    static getMaxSteps(modelId) {
        switch (modelId) {
            case 'chenkin-noob-xl':
                return 50;
            case 'nova-3d-cg-xl':
                return 50;
            default:
                return 50; // Standard limit
        }
    }
    /**
     * Get max CFG scale for model
     */
    static getMaxCFG(modelId) {
        switch (modelId) {
            case 'chenkin-noob-xl':
                return 20.0;
            default:
                return 20.0;
        }
    }
    /**
     * Normalize prompt for quality tag matching
     * Removes special characters for case-insensitive matching
     */
    static normalizeForRegex(text) {
        return text.replace(/[^\w\s]/gi, '').toLowerCase();
    }
}
/**
 * Aspect ratio configuration
 */
export class ResolutionRules {
    static getFluxTiles(aspectRatio) {
        // All Flux resolutions have 4 tiles
        return 4;
    }
}
/**
 * Cost rules by model
 */
export var CostRules;
(function (CostRules) {
    CostRules.TURBO_MODELS = ['zit-turbo', 'sdxl-h100', 'zit-h100'];
    /**
     * Check if model should use turbo pricing
     */
    function isTurboPricing(modelId) {
        return CostRules.TURBO_MODELS.includes(modelId);
    }
    CostRules.isTurboPricing = isTurboPricing;
    /**
     * Get cost multiplier for model
     */
    function getMultiplier(modelId) {
        if (CostRules.isTurboPricing(modelId)) {
            return 2.0; // 2x standard rate
        }
        return 1.0;
    }
    CostRules.getMultiplier = getMultiplier;
})(CostRules || (CostRules = {}));
//# sourceMappingURL=ImageGenerationPolicy.js.map