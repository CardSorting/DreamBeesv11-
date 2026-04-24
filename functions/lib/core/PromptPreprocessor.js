/**
 * Core Service: Prompt Preprocessor
 * Orchestrates prompt sanitization using Domain services
 * Pure orchestration logic, delegates to Domain for actual work
 */
import { ImageGenerationRequest } from '../domain/models/ImageGenerationRequest.js';
import { ImageGenerationPolicy } from '../domain/services/ImageGenerationPolicy.js';
export class PromptPreprocessor {
    /**
     * Preprocess a raw request into a domain-ready format
     * Orchestrates sanitization and quality tag application
     */
    static preprocess(request, isPremiumUser) {
        // Create domain request (handles validation and basic sanitization)
        const domainRequest = ImageGenerationRequest.create(request);
        // Apply model-specific quality tags (business rule)
        const originalPrompt = domainRequest.prompt;
        const processedPrompt = ImageGenerationPolicy.applyModelQualityTags(originalPrompt, domainRequest.modelId);
        // Check if quality tags were actually added
        const qualityTagsApplied = processedPrompt !== originalPrompt;
        // Return request with processed prompt
        const processedRequest = new ImageGenerationRequest(domainRequest.initiatorUid, domainRequest.requestorUid, processedPrompt, domainRequest.negativePrompt, domainRequest.modelId, domainRequest.aspectRatio, domainRequest.steps, domainRequest.cfg, domainRequest.seed, domainRequest.scheduler, domainRequest.targetUserId, domainRequest.image, domainRequest.targetPersonaId, domainRequest.action);
        return {
            sanitizedRequest: processedRequest,
            qualityTagsApplied
        };
    }
    /**
     * Validate prompt is safe for AI generation
     * This is a business rule that applies to all models
     */
    static isPromptSafe(prompt) {
        // Length validation
        if (prompt.length < 5)
            return false;
        if (prompt.length > 50000)
            return false;
        // Content validation
        const safePatterns = [
            /^(?!\s*<).*(?<!\s*>)$/s, // No HTML tags
            /^(?!\s*\`\`\`).*(?<!\s*\`\`\`)$/, // No code blocks
            /^(?!\s*\[).*(?<!\s*\])$/s, // No markdown links
            /^(?!\s*\*\*).*(?<!\s*\*\*)$/s, // No bold markdown
        ];
        // At least one pattern must be broken for safety
        return !safePatterns.some(pattern => pattern.test(prompt));
    }
    /**
     * Calculate prompt complexity score for abuse detection
     * Returns score 0-100 (higher = more complex/promiseful)
     */
    static calculatePromptComplexity(prompt) {
        let score = 0;
        // Length bonus
        if (prompt.length > 100)
            score += 20;
        if (prompt.length > 500)
            score += 30;
        if (prompt.length > 2000)
            score += 10;
        // Keyword bonuses (indicates specific artistic direction)
        const artisticKeywords = [
            'cinematic', 'photorealistic', 'artstation', 'masterpiece',
            'ultra detailed', '4k', '8k', 'HDR', 'ray tracing'
        ];
        artisticKeywords.forEach(keyword => {
            if (prompt.toLowerCase().includes(keyword)) {
                score += 15;
            }
        });
        // Quality marker bonuses
        const qualityMarkers = ['++', '>', '>>'];
        qualityMarkers.forEach(marker => {
            if (prompt.includes(marker)) {
                score += 10;
            }
        });
        // Normalize to 0-100 range
        return Math.min(score, 100);
    }
}
//# sourceMappingURL=PromptPreprocessor.js.map