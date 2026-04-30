/**
 * Domain Model: Image Generation Request
 * Pure business logic representation of an image generation request
 * No I/O, no external dependencies
 */
import { isValidModelId } from '../../lib/modelConventions.js';
export class ImageGenerationRequest {
    initiatorUid;
    requestorUid;
    prompt;
    negativePrompt;
    modelId;
    aspectRatio;
    steps;
    cfg;
    seed;
    scheduler;
    idempotencyKey;
    targetUserId;
    image;
    constructor(initiatorUid, requestorUid, // User making the request (could be target or initiator)
    prompt, negativePrompt, modelId, aspectRatio, steps, cfg, seed, scheduler, idempotencyKey, targetUserId, image) {
        this.initiatorUid = initiatorUid;
        this.requestorUid = requestorUid;
        this.prompt = prompt;
        this.negativePrompt = negativePrompt;
        this.modelId = modelId;
        this.aspectRatio = aspectRatio;
        this.steps = steps;
        this.cfg = cfg;
        this.seed = seed;
        this.scheduler = scheduler;
        this.idempotencyKey = idempotencyKey;
        this.targetUserId = targetUserId;
        this.image = image;
        this.validate();
    }
    /**
     * Create and sanitize a request from raw data
     * This is the main factory method for infrastructure to use
     */
    static create(raw) {
        const initiator = raw.auth?.uid || '';
        const requestor = raw.auth?.uid;
        // Extract request data (handle both raw and pre-wrapped formats)
        const data = raw.data || raw;
        const { prompt, negative_prompt, modelId, aspectRatio, steps, cfg, seed, scheduler, requestId, image, targetUserId, idempotencyKey } = data;
        // Determine initiator vs target
        const callerRole = raw.auth?.token?.role || 'user';
        const realRequestor = (['admin', 'system'].includes(callerRole) && targetUserId) ? targetUserId : initiator;
        // Sanitize prompts
        const sanitizedPrompt = sanitizePrompt(prompt);
        const sanitizedNegativePrompt = sanitizePrompt(negative_prompt);
        return new ImageGenerationRequest(initiator, // Cost/billing tracks to initiator
        realRequestor, // Actual user executing
        sanitizedPrompt, sanitizedNegativePrompt, modelId || "wai-illustrious", aspectRatio || "1:1", parseInt(steps) || 30, parseFloat(cfg) || 7.0, parseInt(seed) || -1, scheduler || 'DPM++ 2M Karras', idempotencyKey, targetUserId, image);
    }
    /**
     * Validate request adheres to business rules
     * Throws TypeError for invalid data
     */
    validate() {
        this.validateInitiator();
        this.validateRequestor();
        this.validatePrompt();
        this.validateModelId();
        this.validateNegativePrompt();
    }
    validateInitiator() {
        if (!this.initiatorUid || typeof this.initiatorUid !== 'string') {
            throw new TypeError('initiatorUid is required and must be a string');
        }
        if (this.initiatorUid === '') {
            throw new TypeError('initiatorUid cannot be empty');
        }
    }
    validateRequestor() {
        if (!this.requestorUid || typeof this.requestorUid !== 'string') {
            throw new TypeError('requestorUid is required and must be a string');
        }
        if (this.requestorUid === '') {
            throw new TypeError('requestorUid cannot be empty');
        }
    }
    validatePrompt() {
        if (!this.prompt || typeof this.prompt !== 'string') {
            throw new TypeError('prompt is required and must be a string');
        }
        if (this.prompt.trim().length < 5) {
            throw new TypeError('prompt must be at least 5 characters after trimming');
        }
        if (this.prompt.length > 5000) {
            throw new TypeError('prompt cannot exceed 5000 characters');
        }
    }
    validateNegativePrompt() {
        if (this.negativePrompt && typeof this.negativePrompt !== 'string') {
            throw new TypeError('negativePrompt must be a string if provided');
        }
        if (this.negativePrompt && this.negativePrompt.length > 5000) {
            throw new TypeError('negativePrompt cannot exceed 5000 characters');
        }
    }
    validateModelId() {
        if (!this.modelId || typeof this.modelId !== 'string') {
            throw new TypeError('modelId is required and must be a string');
        }
        if (!isValidModelId(this.modelId)) {
            throw new TypeError(`Invalid model ID: ${this.modelId}. Please check available models.`);
        }
    }
    /**
     * Get safe generation parameters normalized by business rules
     */
    getSafeParameters() {
        return {
            aspectRatio: Sanitizer.validateAspectRatio(this.aspectRatio),
            steps: Math.min(Math.max(this.steps, 10), 50),
            cfg: Math.min(Math.max(this.cfg, 1.0), 20.0),
            seed: this.seed
        };
    }
    /**
     * Check if this is an admin/privileged operation
     */
    isPrivilegedOperation() {
        return this.requestorUid !== this.initiatorUid;
    }
    /**
     * Check if user has admin privileges
     */
    isAdmin() {
        // This would normally check token claims, but for domain purity
        // we expect the infrastructure to validate this before calling
        return false;
    }
    /**
     * Convert to plain object for JSON serialization
     */
    toJSON() {
        return {
            initiatorUid: this.initiatorUid,
            requestorUid: this.requestorUid,
            prompt: this.prompt,
            negativePrompt: this.negativePrompt,
            modelId: this.modelId,
            ...this.getSafeParameters(),
            seed: this.seed,
            scheduler: this.scheduler,
            targetUserId: this.targetUserId
        };
    }
}
/**
 * Helper: Validate and normalize aspect ratio
 */
export var Sanitizer;
(function (Sanitizer) {
    Sanitizer.VALID_ASPECT_RATIOS = ['1:1', '2:3', '3:2', '9:16', '16:9'];
    function validateAspectRatio(ar) {
        return Sanitizer.VALID_ASPECT_RATIOS.includes(ar) ? ar : '1:1';
    }
    Sanitizer.validateAspectRatio = validateAspectRatio;
    function toNormalizedDimensions(aspectRatio) {
        const map = {
            '1:1': { width: 1024, height: 1024 },
            '2:3': { width: 832, height: 1216 },
            '3:2': { width: 1216, height: 832 },
            '9:16': { width: 768, height: 1344 },
            '16:9': { width: 1344, height: 768 }
        };
        return map[aspectRatio] || map['1:1'];
    }
    Sanitizer.toNormalizedDimensions = toNormalizedDimensions;
    function isValidAspectRatio(ar) {
        return Sanitizer.VALID_ASPECT_RATIOS.includes(ar);
    }
    Sanitizer.isValidAspectRatio = isValidAspectRatio;
})(Sanitizer || (Sanitizer = {}));
/**
 * Remove HTML, Markdown, and other sanitization rules
 * Pure function - no side effects
 */
export function sanitizePrompt(prompt) {
    if (!prompt || typeof prompt !== 'string')
        return '';
    const cleanPrompt = prompt.trim();
    // Remove/replace HTML and Markdown
    const sanitized = cleanPrompt
        .replace(/<[^>]+>/g, '') // Strip HTML tags
        .replace(/```[\s\S]*?```/g, '') // Strip code blocks
        .replace(/\[[^\]]+\]\([^)]+\)/g, '') // Strip markdown links
        .replace(/\*\*[\s\S]*?\*\*/g, '') // Strip bold markdown
        .replace(/#[^\s#]+/g, '') // Strip headers
        .replace(/\d{5,}/g, '') // Remove excessive numbers
        .trim();
    return sanitized;
}
//# sourceMappingURL=ImageGenerationRequest.js.map