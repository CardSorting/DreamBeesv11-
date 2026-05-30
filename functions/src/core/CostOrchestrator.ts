/**
 * Core Service: Cost Orchestrator
 * Orchestrates cost validation and calculation
 * 
 * HARDENED: Zero-latency via flattened User document usage tracking.
 * ALIGNED: Uses ZAP_COSTS from lib/costs.ts exclusively.
 */

import { ZAP_COSTS } from '../lib/costs.js';

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
    if (modelId === 'anima') {
        return 0;
    }
    if (this.isPremiumModel(modelId)) {
        return ZAP_COSTS.IMAGE_GENERATION_PREMIUM;
    }

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

    return { allowed: true, estimatedCost: finalCost };
  }

  /**
   * Check if model is classified as premium
   */
  private static isPremiumModel(modelId: string): boolean {
    const premiumModels = ['wai-illustrious', 'nova-3d-cg-xl'];
    return premiumModels.includes(modelId);
  }
}
