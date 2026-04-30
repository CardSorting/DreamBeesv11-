/**
 * Core Service: Image Generation Orchestrator
 * Main coordination layer for image generation flow
 * Orchestrates Domain → Infrastructure components
 */
import { PromptPreprocessor } from './PromptPreprocessor.js';
import { CostOrchestrator } from './CostOrchestrator.js';
import { ForensicLogger } from '../lib/forensics.js';
import { SubstrateHealth } from '../lib/substrateHealth.js';
import { Wallet } from '../lib/wallet.js';
import { FieldValue } from '../firebaseInit.js';
export class ImageGenerationOrchestrator {
    /**
     * Handle a generation request end-to-end
     * This is the main orchestration point
     */
    static async handleRequest(request, database, isPremiumUser) {
        const startTime = Date.now();
        // 1. Identify Anchor (requestId or idempotencyKey)
        const requestId = request.idempotencyKey
            ? `zap_${request.idempotencyKey}`
            : (request.requestId || this.generateRequestId());
        const forensic = new ForensicLogger({
            requestId,
            workerName: 'Orchestrator',
            taskType: 'submission',
            userId: request.auth?.uid || 'anonymous',
            startTime
        });
        forensic.checkpoint('submission_start');
        return this.executeWithIdempotency(requestId, database, async () => {
            // 1. Preprocess request
            const { sanitizedRequest } = PromptPreprocessor.preprocess(request, isPremiumUser);
            // 2. Circuit Breaker: Check Substrate Health
            const isHealthy = await SubstrateHealth.isHealthy(sanitizedRequest.modelId);
            if (!isHealthy) {
                forensic.checkpoint('circuit_break_triggered');
                throw new Error(`Provider for ${sanitizedRequest.modelId} is currently degraded. Please try again in a few minutes.`);
            }
            // 3. Check quota limits (Internal stub for now)
            const quotaValid = await this.checkQuota(sanitizedRequest.requestorUid, database);
            if (!quotaValid) {
                throw new Error('Quota exceeded');
            }
            // 4. Check active jobs limit
            const activeJobs = await this.getActiveJobsCount(sanitizedRequest.requestorUid, database);
            if (activeJobs >= 15) {
                throw new Error('Too many active jobs. Please wait for current generations to finish.');
            }
            // 5. Validate and calculate cost
            const validationResult = await CostOrchestrator.validateGenerationCost(sanitizedRequest.initiatorUid, sanitizedRequest.modelId, sanitizedRequest.aspectRatio, isPremiumUser, database);
            if (!validationResult.allowed) {
                throw new Error(validationResult.reason || 'Insufficient funds or limit exceeded');
            }
            const finalCost = validationResult.estimatedCost;
            forensic.checkpoint('transaction_prepared');
            // 6. ATOMIC SUBMISSION: Transactional Debit + Queue Document
            await database.runTransaction(async (t) => {
                // A. Debit Wallet
                await Wallet.debit(sanitizedRequest.initiatorUid, finalCost, requestId, { auditType: 'zap_generation', modelId: sanitizedRequest.modelId }, 'zaps', t);
                // B. Create Queue Entry
                await this.queueRequestInTransaction(sanitizedRequest, requestId, finalCost, t, database);
            });
            forensic.checkpoint('submission_complete');
            return {
                requestId
            };
        });
    }
    /**
     * Execute operation with idempotency check
     */
    static async executeWithIdempotency(requestId, database, operation) {
        try {
            const existing = await this.checkIdempotency(requestId, database);
            if (existing) {
                return existing;
            }
            const result = await operation();
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
                return { requestId };
            }
            return null;
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Check user quota (Internal stub)
     */
    static async checkQuota(uid, database) {
        return true;
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
            return 0;
        }
    }
    /**
     * Queue request for generation (Transactional Version)
     */
    static async queueRequestInTransaction(request, requestId, cost, t, database) {
        const safeParams = request.getSafeParameters();
        const ref = database.collection('generation_queue').doc(requestId);
        t.set(ref, {
            userId: request.requestorUid,
            prompt: request.prompt,
            negative_prompt: request.negativePrompt,
            modelId: request.modelId,
            aspectRatio: safeParams.aspectRatio,
            steps: safeParams.steps,
            cfg: safeParams.cfg,
            seed: request.seed,
            scheduler: request.scheduler,
            status: 'queued',
            cost,
            debited: true,
            createdAt: FieldValue.serverTimestamp()
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