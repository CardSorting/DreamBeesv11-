/**
 * Core Service: Image Generation Orchestrator
 * Main coordination layer for image generation flow
 * Orchestrates Domain → Infrastructure components
 */

import { ImageGenerationRequest } from '../domain/models/ImageGenerationRequest.js';
import { PromptPreprocessor } from './PromptPreprocessor.js';
import { CostOrchestrator, CostValidationResult } from './CostOrchestrator.js';
import { ForensicLogger } from '../lib/forensics.js';
import { SubstrateHealth } from '../lib/substrateHealth.js';
import { Wallet } from '../lib/wallet.js';
import { FieldValue } from '../firebaseInit.js';

export interface GenerationResult {
  requestId: string;
  shouldEnqueue?: boolean;
}

export interface GenerationError {
  requestId: string;
  error: string;
  status: 'failed' | 'error';
}

export class ImageGenerationOrchestrator {
  /**
   * Handle a generation request end-to-end
   * This is the main orchestration point
   */
  static async handleRequest(
    request: any,
    database: any
  ): Promise<GenerationResult | GenerationError> {
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

    return this.executeWithIdempotency(requestId, async () => {
      const uid = request.auth?.uid;
      let userData = request.cachedUserData;
      if (!userData) {
        const userDoc = await database.collection('users').doc(uid).get();
        if (!userDoc.exists) {
            throw new Error('User document not found. Please re-authenticate.');
        }
        userData = userDoc.data();
      }

      const userTier = userData.tier || 'free';
      const isPremiumUser = userTier === 'pro' || userTier === 'architect';

      // 2. Preprocess request
      const { sanitizedRequest } = PromptPreprocessor.preprocess(request, isPremiumUser);

      const isHealthy = await SubstrateHealth.isHealthy(sanitizedRequest.modelId);

      if (!isHealthy) {
          forensic.checkpoint('circuit_break_triggered');
          throw new Error(`Provider for ${sanitizedRequest.modelId} is currently degraded. Please try again in a few minutes.`);
      }

      // 3. Validate and calculate cost (Pass userData to avoid re-fetch)
      const validationResult = await CostOrchestrator.validateGenerationCost(
        sanitizedRequest.initiatorUid,
        sanitizedRequest.modelId,
        sanitizedRequest.aspectRatio,
        isPremiumUser,
        database,
        userData // PASSING ALREADY FETCHED DATA
      );

      if (!validationResult.allowed) {
        throw new Error(validationResult.reason || 'Insufficient funds or limit exceeded');
      }

      const finalCost = validationResult.estimatedCost;

      forensic.checkpoint('transaction_prepared');

      // 6. ATOMIC SUBMISSION: Transactional Debit + Queue Document
      let shouldEnqueue = true;
      await database.runTransaction(async (t: any) => {
          const queueRef = database.collection('generation_queue').doc(requestId);
          const existing = await t.get(queueRef);
          if (existing.exists) {
            const st = (existing.data() as any)?.status;
            if (['queued', 'processing', 'completed'].includes(st)) {
              shouldEnqueue = false;
              forensic.checkpoint('idempotent_hit');
              return;
            }
          }

          // A. Debit Wallet
          if (finalCost > 0) {
            await Wallet.debit(
                sanitizedRequest.initiatorUid,
                finalCost,
                requestId,
                { auditType: 'zap_generation', modelId: sanitizedRequest.modelId },
                'zaps',
                t,
                true // TURBO MODE: Direct metabolic increment
            );
          }

          // B. Create Queue Entry
          await this.queueRequestInTransaction(
              sanitizedRequest,
              requestId,
              finalCost,
              t,
              database
          );
      });

      forensic.checkpoint('submission_complete');

      return {
        requestId,
        shouldEnqueue
      };
    });
  }

  /**
   * Execute operation with idempotency check
   */
  private static async executeWithIdempotency(
    requestId: string,
    operation: () => Promise<GenerationResult | GenerationError>
  ): Promise<GenerationResult | GenerationError> {
    try {
      const result = await operation();
      if (!result) {
        throw new Error('Operation completed with no result');
      }

      return result;
    } catch (error: any) {
      console.error(`[Orchestrator] Error in requestId ${requestId}:`, error);
      return {
        requestId,
        error: error.message || 'Unknown error',
        status: 'failed'
      };
    }
  }

  /**
   * Queue request for generation (Transactional Version)
   */
  private static async queueRequestInTransaction(
    request: ImageGenerationRequest,
    requestId: string,
    cost: number,
    t: any,
    database: any
  ): Promise<void> {
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
      stage: 'queued',
      progress: 8,
      cost,
      debited: true,
      createdAt: FieldValue.serverTimestamp()
    });
  }

  /**
   * Generate unique request ID
   */
  private static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }
}
