/**
 * Core Service: Cost Orchestrator
 * Orchestrates cost validation and calculation
 * Coordinates with Domain services for purity
 * 
 * HARDENED: Zero-latency via flattened User document usage tracking.
 */

import { CostCalculator } from '../domain/services/CostCalculator.js';
import { ZAP_COSTS } from '../lib/costs.js';

export interface CostValidationResult {
  allowed: boolean;
  estimatedCost: number;
  reason?: string;
}

export class CostOrchestrator {
  /**
   * Validate if user has sufficient cost budget for generation
   * Orchestrates multiple validation layers using flattened user state.
   */
  static async validateGenerationCost(
    initiatorUid: string,
    modelId: string,
    aspectRatio: string,
    isPremiumUser: boolean,
    database: any
  ): Promise<CostValidationResult> {
    // 1. Calculate estimated cost using Domain service (pure math)
    const estimatedCost = CostCalculator.calculateModelCost(
      modelId,
      isPremiumUser || CostHelpers.isTurboPricing(modelId),
      undefined // We calculate base rate
    );

    // 2. For Flux models, calculate tile-based cost
    let tileBasedCost = 0;
    if (modelId === 'flux-2-dev') {
      tileBasedCost = CostCalculator.calculateFluxCost(aspectRatio, 25); // Default 25 steps
    }

    const finalCost = Math.max(estimatedCost, tileBasedCost);

    // 3. Single-doc lookup: Get user and validate
    const userDoc = await database.collection('users').doc(initiatorUid).get();
    if (!userDoc.exists) {
      return { allowed: false, estimatedCost: finalCost, reason: 'User not found' };
    }

    const userData = userDoc.data() as any;
    const balance = userData.zaps || 0;

    // A. Check balance
    if (balance < finalCost) {
      return {
        allowed: false,
        estimatedCost: finalCost,
        reason: `Insufficient balance. Available: ${balance.toFixed(1)}, Required: ${finalCost.toFixed(1)}`
      };
    }

    // B. Check usage limits (Rate Limiting)
    if (modelId === 'flux-2-dev' || CostHelpers.isTurboPricing(modelId)) {
      // Global limit (still a separate doc as it's shared state)
      const globalUsage = await this.getGlobalDailyUsage(database);
      if (globalUsage >= CostConstants.FLUX_GLOBAL_LIMIT_DAILY) {
        return { allowed: false, estimatedCost: finalCost, reason: 'Global daily limit exceeded' };
      }

      // User limit (FLATTENED: Check directly on User doc)
      const now = new Date();
      const todayId = `${now.getUTCFullYear()}${(now.getUTCMonth() + 1).toString().padStart(2, '0')}${now.getUTCDate().toString().padStart(2, '0')}`;
      
      const userUsage = userData.lastDailySpendId === todayId ? (userData.dailySpend || 0) : 0;
      const dailyLimit = CostHelpers.isTurboPricing(modelId) 
        ? CostConstants.FLUX_USER_LIMIT_DAILY 
        : CostConstants.STANDARD_MODEL_RATE;
      
      if (userUsage >= dailyLimit) {
        return {
          allowed: false,
          estimatedCost: finalCost,
          reason: 'Daily usage limit exceeded'
        };
      }
    }

    return { allowed: true, estimatedCost: finalCost };
  }

  /**
   * Get global daily usage (for rate limit tracking)
   */
  private static async getGlobalDailyUsage(database: any): Promise<number> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const statsDoc = await database.collection('stats').doc('daily-cost').get();
      if (!statsDoc.exists) return 0;
      const stats = statsDoc.data() as any;
      return stats[today] || 0;
    } catch (error) {
      console.error('Error fetching global usage:', error);
      return 0;
    }
  }

  /**
   * Record cost for transaction
   * FLATTENED: Writes directly to User document for maximum speed.
   */
  static async recordCost(
    uid: string,
    cents: number,
    database: any,
    requestId: string,
    metadata: any = {}
  ): Promise<void> {
    try {
      const { Wallet } = await import('../lib/wallet.js');
      
      // FAST-PATH: Use Wallet.debit in turbo mode
      await Wallet.debit(uid, cents, requestId || `cost_${Date.now()}`, {
        ...metadata,
        auditType: 'generation_cost'
      }, 'zaps', null, true);

      // Global cost update (separate write, but non-blocking)
      const todayShort = new Date().toISOString().split('T')[0];
      const globalCostRef = database.collection('stats').doc('daily-cost');
      globalCostRef.set({
        [todayShort]: database.FieldValue.increment(cents),
        lastUpdate: database.FieldValue.serverTimestamp()
      }, { merge: true }).catch(err => console.error('Global cost update failed', err));

    } catch (error) {
      console.error('Error recording cost:', error);
      throw error;
    }
  }
}

/**
 * Constants for cost orchestration
 * Synchronized with industrial Zap throughput requirements.
 */
const CostConstants = {
  FLUX_GLOBAL_LIMIT_DAILY: 5000, 
  FLUX_USER_LIMIT_DAILY: 200, 
  STANDARD_MODEL_RATE: 1, 
  PREMIUM_MODEL_RATE: 5 
};

/**
 * Helper functions for cost logic
 */
export namespace CostHelpers {
  export function isTurboPricing(modelId: string): boolean {
    return ['zit-turbo', 'sdxl-h100', 'zit-h100'].includes(modelId);
  }

  export function getMultiplier(modelId: string): number {
    return isTurboPricing(modelId) ? 5 : 1;
  }
}
