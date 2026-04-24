/**
 * Core Service: Cost Orchestrator
 * Orchestrates cost validation and calculation
 * Coordinates with Domain services for purity
 */
import { CostCalculator } from '../domain/services/CostCalculator.js';
export class CostOrchestrator {
    /**
     * Validate if user has sufficient cost budget for generation
     * Orchestrates multiple validation layers
     */
    static async validateGenerationCost(initiatorUid, modelId, aspectRatio, isPremiumUser, database) {
        // Calculate estimated cost using Domain service (pure math)
        const fluxModelId = modelId === 'flux-2-dev' ? modelId : null;
        const estimatedCost = CostCalculator.calculateModelCost(modelId, isPremiumUser || CostHelpers.isTurboPricing(modelId), undefined // We'll calculate this from steps in the actual handler
        );
        // For Flux models, calculate tile-based cost
        let tileBasedCost = 0;
        if (modelId === 'flux-2-dev') {
            tileBasedCost = CostCalculator.calculateFluxCost(aspectRatio, 25); // Default 25 steps
        }
        const finalCost = Math.max(estimatedCost, tileBasedCost);
        // 1. Check if user has enough balance
        const balance = await this.getUserBalance(initiatorUid, database);
        if (balance < finalCost) {
            return {
                allowed: false,
                estimatedCost: finalCost,
                reason: `Insufficient balance. Available: ${balance}, Required: ${finalCost}`
            };
        }
        // 2. Check global daily limit (if applicable)
        if (modelId === 'flux-2-dev' || CostHelpers.isTurboPricing(modelId)) {
            const globalUsage = await this.getGlobalDailyUsage(database);
            if (globalUsage >= CostConstants.FLUX_GLOBAL_LIMIT_DAILY) {
                return {
                    allowed: false,
                    estimatedCost: finalCost,
                    reason: 'Global daily limit exceeded'
                };
            }
            // 3. Check user daily limit
            const userUsage = await this.getUserDailyUsage(initiatorUid, database);
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
        // All checks passed
        return {
            allowed: true,
            estimatedCost: finalCost
        };
    }
    /**
     * Get available balance for user
     */
    static async getUserBalance(uid, database) {
        try {
            const userDoc = await database.collection('users').doc(uid).get();
            if (!userDoc.exists)
                return 0;
            const userData = userDoc.data();
            return userData.credits || 0;
        }
        catch (error) {
            console.error('Error fetching user balance:', error);
            return 0;
        }
    }
    /**
     * Get global daily usage (for rate limit tracking)
     */
    static async getGlobalDailyUsage(database) {
        try {
            const today = new Date().toISOString().split('T')[0];
            const statsDoc = await database.collection('stats').doc('daily-cost').get();
            if (!statsDoc.exists)
                return 0;
            const stats = statsDoc.data();
            return stats[today] || 0;
        }
        catch (error) {
            console.error('Error fetching global usage:', error);
            return 0;
        }
    }
    /**
     * Get user daily usage (for rate limit tracking)
     */
    static async getUserDailyUsage(uid, database) {
        try {
            const today = new Date().toISOString().split('T')[0];
            const usageDoc = await database.collection('users').doc(uid).collection('daily-costs').doc(today).get();
            if (!usageDoc.exists)
                return 0;
            const usage = usageDoc.data();
            return usage.totalSpend || 0;
        }
        catch (error) {
            console.error('Error fetching user daily usage:', error);
            return 0;
        }
    }
    /**
     * Record cost for transaction
     */
    static async recordCost(uid, cents, database, metadata) {
        try {
            const today = new Date().toISOString().split('T')[0];
            // Update user daily cost
            const dailyCostRef = database.collection('users').doc(uid).collection('daily-costs').doc(today);
            await dailyCostRef.set({
                totalSpend: database.FieldValue.increment(cents),
                lastUpdate: database.FieldValue.serverTimestamp(),
                count: database.FieldValue.increment(1)
            }, { merge: true });
            // Update global daily cost
            const globalCostRef = database.collection('stats').doc('daily-cost');
            await globalCostRef.set({
                [today]: database.FieldValue.increment(cents),
                lastUpdate: database.FieldValue.serverTimestamp()
            }, { merge: true });
            // Update user's main credits balance (if needed)
            // This is typically handled by the Billing service
        }
        catch (error) {
            console.error('Error recording cost:', error);
            throw error;
        }
    }
}
/**
 * Constants for cost orchestration
 */
const CostConstants = {
    FLUX_GLOBAL_LIMIT_DAILY: 5000, // 50.00 in cents
    FLUX_USER_LIMIT_DAILY: 200, // 2.00 in cents
    STANDARD_MODEL_RATE: 1, // 0.01 in cents
    PREMIUM_MODEL_RATE: 5 // 0.05 in cents
};
/**
 * Helper functions for cost logic
 * Separate from CostRules to avoid circular references
 */
export var CostHelpers;
(function (CostHelpers) {
    function isTurboPricing(modelId) {
        return ['zit-turbo', 'sdxl-h100', 'zit-h100'].includes(modelId);
    }
    CostHelpers.isTurboPricing = isTurboPricing;
    function getMultiplier(modelId) {
        if (CostHelpers.isTurboPricing(modelId)) {
            return 5; // 5x standard rate
        }
        return 1;
    }
    CostHelpers.getMultiplier = getMultiplier;
})(CostHelpers || (CostHelpers = {}));
//# sourceMappingURL=CostOrchestrator.js.map