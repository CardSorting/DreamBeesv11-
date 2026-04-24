/**
 * Domain Service: Cost Calculator
 * Pure business logic for image generation cost calculations
 * No I/O, no external dependencies
 */

export class CostCalculator {
  /**
   * Calculate Flux Dev cost
   * Rule: tiles * steps * 0.00041
   */
  static calculateFluxCost(aspectRatio: string, steps?: number): number {
    const tiles = CostCalculator.getFluxTiles(aspectRatio);
    const s = steps || 20; // Default for flux
    return tiles * s * 0.00041;
  }

  /**
   * Calculate generation cost based on model type and subscription
   */
  static calculateModelCost(
    modelId: string,
    isPremium: boolean,
    steps?: number
  ): number {
    if (isPremium) {
      return CostCalculator.calculatePremiumCost(modelId, steps);
    }
    return CostCalculator.calculateStandardCost(steps || 30);
  }

  /**
   * Calculate cost for premium models (Zit Turbo, Zit Base, SDXL H100)
   */
  private static calculatePremiumCost(modelId: string, steps?: number): number {
    // Premium models have higher base rate but same cost calculation
    const s = steps || 30;
    const baseRate = 0.05; // $0.05 per step
    return baseRate * (s / 30); // Normalize to 30-step baseline
  }

  /**
   * Calculate cost for standard models (free or paid)
   */
  private static calculateStandardCost(steps: number): number {
    // Standard models are $0.01 per generation (flat) or subscription-based
    const baseRate = 0.01;
    return baseRate;
  }

  /**
   * Get tile count for Flux cost calculation based on aspect ratio
   */
  private static getFluxTiles(aspectRatio: string): number {
    // All Flux resolutions are 4 tiles
    // 1024x1024 = 4 tiles @ 512x512 each
    return 4;
  }

  /**
   * Convert cost to formatted string
   */
  static formatCost(cents: number): string {
    return `$${(cents / 100).toFixed(4)}`;
  }

  /**
   * Convert cents to dollars (float)
   */
  static toDollars(cents: number): number {
    return cents / 100;
  }
}

/**
 * Constants for cost calculation
 */
export namespace CostConstants {
  export const FLUX_GLOBAL_LIMIT_DAILY = 50.00; // $50/day
  export const FLUX_USER_LIMIT_DAILY = 2.00; // $2/day
  
  export const PREMIUM_MODEL_BASE_RATE = 0.05; // $0.05 per step
  export const STANDARD_MODEL_RATE = 0.01; // $0.01 per generation
  
  export const GLOBAL_LIMIT_DAYS = 1; // Track for 1 day
  export const USER_LIMIT_DAYS = 1; // Track for 1 day
}

/**
 * Get initialization cost for different models
 */
export namespace ModelCosts {
  export const INITIAL_COSTS: Record<string, number> = {
    'wai-illustrious': 20, // Free initial trial Zaps
    'chenkin-noob-xl': 20,
    'nova-3d-cg-xl': 20,
    'sdxl_h100': 50, // Requires purchase
    'flux-klein-9b': 0, // API-based, free tier
    'flux-2-dev': 0, // API-based, free tier
    'zit-h100': 10, // Subscription required
    'zit-base': 10,
  };
}
