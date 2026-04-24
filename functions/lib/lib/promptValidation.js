/**
 * Prompt Validation Infrastructure Layer
 *
 * Purpose: Input sanitization and content filtering for AI-generated images
 * Location: Infrastructure (adapters, security, validation)
 * Principle: Pure validation logic with no side effects
 */
/**
* Security profile for prompt validation thresholds
* These values can be refined based on model behavior monitoring
*/
export const SECURITY_THRESHOLDS = {
    MAX_TOKENS: 400, // Safe size estimate after tokenization (approx 3 chars/word)
    MIN_TOKENS: 5,
    BANNED_PATTERNS: [
        // Malware injection patterns
        /<script.*?>|<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi, // Event handlers
        /data:\s*image\//gi, // Data URI injection
        /base64\:/gi, // Base64 encoding attacks
        /\\x[0-9a-f]{2}/gi, // Hex encoding attacks
        /<iframe|<embed|<object|<applet/gi, // Injection vectors
        /eval\s*\(/gi,
        /new\s+Function\s*\(/gi,
        // Jailbreak patterns
        /ignore\s+all\s+previous\s+instructions|ignore\s+all\s+rules|disregard\s+all\s+guardrails/gi,
        /pretend\s+you\s+are|simulate\s+the\s+personality\s+of|act\s+as\s+the\s+persona\s+of/gi,
        /don't\s*use\s*the\s*[Gg]uardrails|bypass\s*the\s*[Gg]uardrails/gi,
        // Prompt injection variations
        /system\s+prompt\s+override|modify\s+the\s+system\s+prompt|inject\s+into\s+system/gi,
        /UNSAFE|FORBIDDEN|RESTRICTED/gi // Explicit abuse markers
    ],
    WARN_PATTERNS: [
        // Repeated characters (potential DoS or testing)
        /(.)\1{4,}/, // >5 same characters in a row
        /\.{10,}/, // Many dots
        /\s{20,}/, // Excessive whitespace
        // Suspicious patterns
        /\!\s*\!\s*\!/gi, // Excessive punctuation
        /\?{5,}/gi, // Excessive question marks
        /\*{5,}/gi, // Excessive asterisks
        // Potential prompt engineering abuse
        /Advanced\s+prompt\s+engineering|prompt\s+crafting\s+techniques/gi,
        /structured\s+prompt\s+format|json\s+prompt\s+format/gi
    ]
};
/**
* Validates and sanitizes prompts to prevent injection attacks and ensure safe generation
*
* @param prompt The raw prompt string from user
* @param options Optional validation configuration
* @returns PromptValidationResult with validation status and sanitization results
*
* @throws Will throw if prompt is undefined or null
*/
export function validatePrompt(prompt, options) {
    if (!prompt) {
        throw new Error("Prompt cannot be empty");
    }
    const { minLength = SECURITY_THRESHOLDS.MIN_TOKENS, maxLength = SECURITY_THRESHOLDS.MAX_TOKENS, allowHyperlink = false, sanitizeNewlines = true } = options || {};
    const errors = [];
    const warnings = [];
    let sanitizedPrompt = prompt;
    // 1. Length validation
    if (sanitizedPrompt.length < minLength) {
        errors.push(`Prompt too short: minimum ${minLength} characters required`);
        return { isValid: false, errors, warnings };
    }
    if (sanitizedPrompt.length > maxLength) {
        errors.push(`Prompt too long: maximum ${maxLength} characters allowed`);
        sanitizedPrompt = sanitizedPrompt.substring(0, maxLength);
    }
    // 2. Stripping HTML/script tags for security
    if (!allowHyperlink) {
        // Remove potential HTML/JS injection
        const htmlRemoved = sanitizedPrompt
            .replace(/<br\s*\/?>/gi, (match) => {
            return sanitizeNewlines ? "\n" : match;
        })
            .replace(/<strong>|<\/strong>/gi, (match) => (sanitizeNewlines ? "\n" : match))
            .replace(/<em>|<\/em>/gi, (match) => (sanitizeNewlines ? "\n" : match));
        sanitizedPrompt = htmlRemoved;
    }
    // 3. Check for banned patterns (Critical security violation)
    const bannedMatch = SECURITY_THRESHOLDS.BANNED_PATTERNS.some(pattern => pattern.test(sanitizedPrompt));
    if (bannedMatch) {
        // Capture the exact banned pattern for logging
        const matchedPatterns = SECURITY_THRESHOLDS.BANNED_PATTERNS
            .filter(pattern => pattern.test(sanitizedPrompt))
            .map(pattern => pattern.toString());
        errors.push(`Security violation detected: prompt contains suspicious content`, `Blocked patterns: ${matchedPatterns.join(', ')}`);
        // Refund attempt for security violation
        logger.warn(`[Security] Blocked prompt validation from user`, {
            patternCount: matchedPatterns.length,
            patterns: matchedPatterns,
            length: sanitizedPrompt.length
        });
        return { isValid: false, errors, warnings };
    }
    // 4. Check for warning patterns (Potentially suspicious)
    SECURITY_THRESHOLDS.WARN_PATTERNS.forEach(pattern => {
        if (pattern.test(sanitizedPrompt)) {
            warnings.push(`Prompt contains potentially suspicious pattern`);
        }
    });
    // 5. Check for repeated aggressive language (DoS potential)
    const aggressiveWords = ['kill', 'destroy', 'hate', 'pain', 'die', 'kill', 'attack'];
    const aggressiveMatches = aggressiveWords.filter(word => new RegExp(`\\b${word}\\b`, 'gi').test(sanitizedPrompt));
    if (aggressiveMatches.length > 3) {
        warnings.push(`High frequency of aggressive language detected`);
    }
    // 6. Validate prompt contains actual words (not just noise)
    const wordCount = sanitizedPrompt.trim().split(/\s+/).length;
    if (wordCount < 2) {
        errors.push("Prompt must contain at least 2 meaningful words");
        return { isValid: false, errors, warnings };
    }
    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        sanitizedPrompt: sanitizedPrompt.trim()
    };
}
/**
* Validates image parameters to prevent resource exhaustion attacks
*
* @param steps Number of generation steps requested
* @param aspectRatio Aspect ratio specification
* @param width Width in pixels
* @param height Height in pixels
* @returns Object containing validation status and allowed parameters
*/
export function validateGenerationParameters(steps, aspectRatio, width, height) {
    const errors = [];
    // Step validation
    if (steps < 1 || steps > 150) {
        errors.push("Steps must be between 1 and 150");
        steps = 30; // Default safe value
    }
    // Resolution validation (prevent oversized images)
    const maxResolution = 4096;
    if (width > maxResolution || height > maxResolution) {
        errors.push(`Resolution too high: max dimension is ${maxResolution}px`);
    }
    // Reasonable aspect ratio check
    const aspectRatioMap = {
        '1:1': '1.0',
        '2:3': '0.67',
        '3:2': '1.5',
        '9:16': '0.56',
        '16:9': '1.78'
    };
    const expectedRatio = aspectRatioMap[aspectRatio];
    if (!expectedRatio) {
        errors.push(`Invalid aspect ratio: ${aspectRatio}`);
        aspectRatio = '1:1';
    }
    const area = width * height;
    const maxArea = 8 * 1024 * 1024; // 8MP max
    if (area > maxArea) {
        errors.push("Image area exceeds maximum limit");
    }
    return {
        isValid: errors.length === 0,
        adjusted: { steps, width, height },
        errors
    };
}
/**
* Security logger for tracking validation attempts
* This logs to infrastructure's centralized logging system
*/
export const logger = {
    warn(message, metadata) {
        // In production, this would send to proper logging infrastructure
        console.warn(`[PromptValidator] ${message}`, metadata);
    },
    error(message, metadata) {
        console.error(`[PromptValidator] ${message}`, metadata);
    },
    info(message, metadata) {
        console.info(`[PromptValidator] ${message}`, metadata);
    }
};
//# sourceMappingURL=promptValidation.js.map