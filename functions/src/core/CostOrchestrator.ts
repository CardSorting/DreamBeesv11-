/**
 * Core Service: Cost Orchestrator
 * Orchestrates cost validation and calculation
 * 
 * HARDENED: Zero-latency via flattened User document usage tracking.
 * ALIGNED: Uses ZAP_COSTS from lib/costs.ts exclusively.
 */

import { ZAP_COSTS, calculateFluxCost } from '../lib/costs.js';

export interface CostValidationResult {
  allowed: boolean;
  estimatedCost: number;
  reason?: string;
}

export class CostOrchestrator {
  /**
   * Calculate final generation cost based on model and user status
   */
  static calculateFinalCost(
    modelId: string,
    isPremiumUser: boolean,
    aspectRatio: string,
    steps?: number
  ): number {
    // 1. Check for Flux specific cost
    if (modelId === 'flux-2-dev') {
        return calculateFluxCost(aspectRatio, steps || 25);
    }

    // 2. Check for Premium models
    if (this.isPremiumModel(modelId)) {
        return ZAP_COSTS.IMAGE_GENERATION_PREMIUM;
    }

    // 3. Standard cost
    return isPremiumUser ? 0 : ZAP_COSTS.IMAGE_GENERATION;
  }

  /**
   * Validate if user has sufficient cost budget for generation
   */
  static async validateGenerationCost(
    initiatorUid: string,
    modelId: string,
    aspectRatio: string,
    isPremiumUser: boolean,
    database: any,
    cachedUserData?: any // Optional pre-loaded data
  ): Promise<CostValidationResult> {
    // 1. Calculate final cost
    const finalCost = this.calculateFinalCost(modelId, isPremiumUser, aspectRatio);

    // 2. Doc lookup: Use cache or fetch
    let userData = cachedUserData;
    if (!userData) {
      const userDoc = await database.collection('users').doc(initiatorUid).get();
      if (!userDoc.exists) {
        return { allowed: false, estimatedCost: finalCost, reason: 'User not found' };
      }
      userData = userDoc.data();
    }
    const balance = userData.zaps || 0;
    const tier = userData.tier || 'free';
    const isSubscriber = tier === 'pro' || tier === 'architect';

    // A. Check balance (Subscribers have 'unlimited' zaps which bypasses the comparison)
    if (balance !== 'unlimited' && balance < finalCost) {
      return {
        allowed: false,
        estimatedCost: finalCost,
        reason: `Insufficient balance. Available: ${balance.toFixed(1)}, Required: ${finalCost.toFixed(1)}`
      };
    }

    // B. Check usage limits (Rate Limiting)
    if (modelId === 'flux-2-dev') {
      // Global limit (still a separate doc as it's shared state)
      const globalUsage = await this.getGlobalDailyUsage(database);
      if (globalUsage >= CostConstants.FLUX_GLOBAL_LIMIT_DAILY) {
        return { allowed: false, estimatedCost: finalCost, reason: 'Global daily limit exceeded' };
      }

      // User limit (FLATTENED: Check directly on User doc)
      const now = new Date();
      const todayId = `${now.getUTCFullYear()}${(now.getUTCMonth() + 1).toString().padStart(2, '0')}${now.getUTCDate().toString().padStart(2, '0')}`;
      
      const userUsage = userData.lastDailySpendId === todayId ? (userData.dailySpend || 0) : 0;
      const dailyLimit = CostConstants.FLUX_USER_LIMIT_DAILY;
      
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
   * Check if model is classified as premium
   */
  private static isPremiumModel(modelId: string): boolean {
    const premiumModels = ['wai-illustrious', 'nova-3d-cg-xl'];
    return premiumModels.includes(modelId);
  }
}

/**
 * Constants for cost orchestration
 */
const CostConstants = {
  FLUX_GLOBAL_LIMIT_DAILY: 5000, 
  FLUX_USER_LIMIT_DAILY: 200
};
