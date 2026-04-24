/**
 * Core Service: Image Generation Orchestrator
 * Main coordination layer for image generation flow
 * Orchestrates Domain → Infrastructure components
 */
import { CostCalculator } from '../domain/services/CostCalculator.js';
import { ImageGenerationPolicy } from '../domain/services/ImageGenerationPolicy.js';
import { PromptPreprocessor } from './PromptPreprocessor.js';
import { CostOrchestrator } from './CostOrchestrator.js';
export class ImageGenerationOrchestrator {
    /**
     * Handle a generation request end-to-end
     * This is the main orchestration point
     */
    static async handleRequest(request, database, isPremiumUser) {
        const requestId = request.requestId || this.generateRequestId();
        return this.executeWithIdempotency(requestId, database, async () => {
            // 1. Preprocess request (sanitization, validation)
            const { sanitizedRequest } = PromptPreprocessor.preprocess(request, isPremiumUser);
            // 2. Check quota limits (rate limiting)
            const quotaValid = await this.checkQuota(sanitizedRequest.requestorUid, database);
            if (!quotaValid) {
                return {
                    requestId,
                    wheelUp: false,
                    milestoneReached: false,
                    questsProgressed: [],
                    questsCompleted: [],
                    achievementsUnlocked: []
                };
            }
            // 3. Validate target persona (if applicable)
            await this.validateTargetPersona(sanitizedRequest, database);
            // 4. Check active jobs limit
            const activeJobs = await this.getActiveJobsCount(sanitizedRequest.requestorUid, database);
            if (activeJobs >= 10) {
                return {
                    requestId,
                    wheelUp: false,
                    milestoneReached: false,
                    questsProgressed: [],
                    questsCompleted: [],
                    achievementsUnlocked: []
                };
            }
            // 5. Validate and check cost
            const validationResult = await CostOrchestrator.validateGenerationCost(sanitizedRequest.initiatorUid, sanitizedRequest.modelId, sanitizedRequest.aspectRatio, isPremiumUser, database);
            if (!validationResult.allowed) {
                return {
                    requestId,
                    wheelUp: false,
                    milestoneReached: false,
                    questsProgressed: [],
                    questsCompleted: [],
                    achievementsUnlocked: []
                };
            }
            // 6. Calculate exact cost
            const modelDefaults = ImageGenerationPolicy.getModelDefaults(sanitizedRequest.modelId);
            const safeParams = sanitizedRequest.getSafeParameters();
            const finalCost = CostCalculator.calculateModelCost(sanitizedRequest.modelId, isPremiumUser, safeParams.steps);
            // 7. Update status to queued
            await this.queueRequest(sanitizedRequest, requestId, database);
            // 8. Return results (will be dispatched to worker off-main-thread)
            return {
                requestId,
                wheelUp: false, // Calculated by Billing service
                milestoneReached: false,
                questsProgressed: [],
                questsCompleted: [],
                achievementsUnlocked: []
            };
        });
    }
    /**
     * Execute operation with idempotency check
     */
    static async executeWithIdempotency(requestId, database, operation) {
        try {
            // Check if already processed (idempotency)
            const existing = await this.checkIdempotency(requestId, database);
            if (existing) {
                return existing;
            }
            // Execute operation
            const result = await operation();
            // If successful, mark as processed
            if (!result) {
                throw new Error('Operation completed with no result');
            }
            return result;
        }
        catch (error) {
            console.error(`[Orchestrator] Error in requestId ${requestId}:`, error);
            return {
                requestId,
                error: error.message || 'Unknown error',
                status: 'failed'
            };
        }
    }
    /**
     * Check if request has already been processed (idempotency)
     */
    static async checkIdempotency(requestId, database) {
        try {
            const doc = await database.collection('generation_queue').doc(requestId).get();
            if (doc.exists && ['processing', 'completed'].includes(doc.data().status)) {
                console.log(`[Orchestrator] Idempotent: ${requestId}`);
                return {
                    requestId,
                    wheelUp: false,
                    milestoneReached: false,
                    questsProgressed: [],
                    questsCompleted: [],
                    achievementsUnlocked: []
                };
            }
            return null;
        }
        catch (error) {
            console.error('Idempotency check failed:', error);
            return null;
        }
    }
    /**
     * Check user quota
     */
    static async checkQuota(uid, database) {
        // This would call the quota system
        // For now, return true after implementing quota checks
        return true;
    }
    /**
     * Validate target persona if provided
     */
    static async validateTargetPersona(request, database) {
        if (!request.targetPersonaId) {
            return;
        }
        if (request.action !== 'update_avatar') {
            return;
        }
        const pDoc = await database.collection('personas').doc(request.targetPersonaId).get();
        if (!pDoc.exists || pDoc.data().createdBy !== request.requestorUid) {
            throw new Error('Invalid target persona');
        }
    }
    /**
     * Get active jobs count for user
     */
    static async getActiveJobsCount(uid, database) {
        try {
            const snap = await database.collection('generation_queue')
                .where('userId', '==', uid)
                .where('status', 'in', ['queued', 'processing'])
                .limit(11)
                .get();
            return snap.size;
        }
        catch (error) {
            console.error('Error getting active jobs:', error);
            return 0;
        }
    }
    /**
     * Queue request for generation
     */
    static async queueRequest(request, requestId, database) {
        const safeParams = request.getSafeParameters();
        const meta = {
            promptHash: request.prompt,
            promptMetadata: null // Would be calculated in plumbing
        };
        await database.collection('generation_queue').doc(requestId).set({
            userId: request.requestorUid, // Execute as user
            prompt: request.prompt,
            negative_prompt: request.negativePrompt,
            modelId: request.modelId,
            aspectRatio: safeParams.aspectRatio,
            steps: safeParams.steps,
            cfg: safeParams.cfg,
            seed: request.seed,
            scheduler: request.scheduler,
            promptHash: meta.promptHash,
            promptMetadata: meta.promptMetadata,
            status: 'queued',
            createdAt: database.FieldValue.serverTimestamp()
            // Other fields added by billing service
        });
    }
    /**
     * Generate unique request ID
     */
    static generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }
}
//# sourceMappingURL=ImageGenerationOrchestrator.js.map