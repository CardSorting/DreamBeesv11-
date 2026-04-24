/**
 * Core Service: Image Generation Orchestrator
 * Main coordination layer for image generation flow
 * Orchestrates Domain → Infrastructure components
 */

import { ImageGenerationRequest } from '../domain/models/ImageGenerationRequest.js';
import { CostCalculator } from '../domain/services/CostCalculator.js';
import { ImageGenerationPolicy } from '../domain/services/ImageGenerationPolicy.js';
import { PromptPreprocessor } from './PromptPreprocessor.js';
import { CostOrchestrator, CostValidationResult } from './CostOrchestrator.js';
import { ForensicLogger } from '../lib/forensics.js';
import { SubstrateHealth } from '../lib/substrateHealth.js';
import { Wallet } from '../lib/wallet.js';

export interface GenerationResult {
  requestId: string;
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
    database: any,
    isPremiumUser: boolean
  ): Promise<GenerationResult | GenerationError> {
    const startTime = Date.now();
    
    // 1. Identify Anchor (requestId or idempotencyKey)
    // If client provides idempotencyKey, use it to anchor the requestId
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

      // 3. Check quota limits
      const quotaValid = await this.checkQuota(sanitizedRequest.requestorUid, database);
      if (!quotaValid) {
        throw new Error('Quota exceeded');
      }

      // 4. Validate target persona
      await this.validateTargetPersona(sanitizedRequest, database);

      // 5. Check active jobs limit
      const activeJobs = await this.getActiveJobsCount(sanitizedRequest.requestorUid, database);
      if (activeJobs >= 15) { // Increased for industrial throughput
        throw new Error('Too many active jobs. Please wait for current generations to finish.');
      }

      // 6. Validate cost
      const validationResult = await CostOrchestrator.validateGenerationCost(
        sanitizedRequest.initiatorUid,
        sanitizedRequest.modelId,
        sanitizedRequest.aspectRatio,
        isPremiumUser,
        database
      );

      if (!validationResult.allowed) {
        throw new Error(validationResult.reason || 'Insufficient funds or limit exceeded');
      }

      // 7. Calculate exact cost
      const safeParams = sanitizedRequest.getSafeParameters();
      const finalCost = CostCalculator.calculateModelCost(
        sanitizedRequest.modelId,
        isPremiumUser,
        safeParams.steps
      );

      forensic.checkpoint('transaction_prepared');

      // 8. ATOMIC SUBMISSION: Transactional Debit + Queue Document
      await database.runTransaction(async (t: any) => {
          // A. Debit Wallet (Upstream Debit)
          // This ensures the financial transaction is absolute before work starts
          await Wallet.debit(
              sanitizedRequest.initiatorUid,
              finalCost,
              requestId,
              { auditType: 'zap_generation', modelId: sanitizedRequest.modelId },
              'zaps',
              t
          );

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
        requestId
      };
    });
  }

  /**
   * Execute operation with idempotency check
   */
  private static async executeWithIdempotency(
    requestId: string,
    database: any,
    operation: () => Promise<GenerationResult | GenerationError>
  ): Promise<GenerationResult | GenerationError> {
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
   * Check if request has already been processed (idempotency)
   */
  private static async checkIdempotency(requestId: string, database: any): Promise<any> {
    try {
      const doc = await database.collection('generation_queue').doc(requestId).get();
      if (doc.exists && ['processing', 'completed'].includes((doc.data() as any).status)) {
        console.log(`[Orchestrator] Idempotent: ${requestId}`);
        return {
          requestId
        };
      }
      return null;
    } catch (error) {
      console.error('Idempotency check failed:', error);
      return null;
    }
  }

  /**
   * Check user quota
   */
  private static async checkQuota(uid: string, database: any): Promise<boolean> {
    // This would call the quota system
    // For now, return true after implementing quota checks
    return true;
  }

  /**
   * Validate target persona if provided
   */
  private static async validateTargetPersona(
    request: ImageGenerationRequest,
    database: any
  ): Promise<void> {
    if (!request.targetPersonaId) {
      return;
    }

    if (request.action !== 'update_avatar') {
      return;
    }

    const pDoc = await database.collection('personas').doc(request.targetPersonaId).get();
    if (!pDoc.exists || (pDoc.data() as any).createdBy !== request.requestorUid) {
      throw new Error('Invalid target persona');
    }
  }

  /**
   * Get active jobs count for user
   */
  private static async getActiveJobsCount(uid: string, database: any): Promise<number> {
    try {
      const snap = await database.collection('generation_queue')
        .where('userId', '==', uid)
        .where('status', 'in', ['queued', 'processing'])
        .limit(11)
        .get();
      return snap.size;
    } catch (error) {
      console.error('Error getting active jobs:', error);
      return 0;
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
    const meta = {
      promptHash: request.prompt,
      promptMetadata: null 
    };

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
      promptHash: meta.promptHash,
      promptMetadata: meta.promptMetadata,
      status: 'queued',
      cost,
      debited: true, // Mark that we've already taken the zaps
      createdAt: database.FieldValue.serverTimestamp()
    });
  }

  /**
   * Queue request for generation (Legacy non-transactional)
   */
  private static async queueRequest(
    request: ImageGenerationRequest,
    requestId: string,
    database: any
  ): Promise<void> {
    await database.collection('generation_queue').doc(requestId).set({
      userId: request.requestorUid,
      prompt: request.prompt,
      negative_prompt: request.negativePrompt,
      modelId: request.modelId,
      aspectRatio: request.aspectRatio,
      status: 'queued',
      createdAt: database.FieldValue.serverTimestamp()
    });
  }

  /**
   * Generate unique request ID
   */
  private static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }
}