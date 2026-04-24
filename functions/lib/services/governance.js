import { db } from '../firebaseInit.js';
import { logger } from '../lib/utils.js';
import { Timestamp } from 'firebase-admin/firestore';
const DEFAULT_POLICY = {
    killSwitchActive: false,
    maxAmountPerTrade: 5000,
    dailyVolumeLimit: 1000000,
    updatedBy: 'system_init',
    maxSlippage: 0.05,
    platformFee: 0.001,
    minReputationForLiveTrading: 0,
    reputationMultipliers: {
        'Novice': 1,
        'Trader': 1.5,
        'Influencer': 2.0,
        'Whale': 5.0
    },
    physics: {
        DEFAULT_BONDING_SLOPE: 0.0001,
        MIN_VOLATILITY_FACTOR: 0.01,
        DEFAULT_VOLATILITY_FACTOR: 0.05,
        PUMP_THRESHOLD: 0.05,
        DUMP_THRESHOLD: -0.05,
        STALE_ORDER_THRESHOLD_MS: 300000,
        DEFAULT_BASE_PRICE: 1.0,
        DEFAULT_VOLATILITY: 0.05,
        CIRCUIT_BREAKER_VOL_REDLINE: 0.15,
        CIRCUIT_BREAKER_VOL_YELLOW: 0.08
    }
};
export const governanceService = {
    async getPolicy() {
        const doc = await db.collection('zap_governance').doc('global_policy').get();
        if (doc.exists) {
            return doc.data();
        }
        // Initialize if not exists
        const policy = { ...DEFAULT_POLICY, lastUpdated: Timestamp.now() };
        await db.collection('zap_governance').doc('global_policy').set(policy);
        return policy;
    },
    async checkVolatility(derivativeId, newPrice) {
        // Backend volatility tracking. Ideally uses a sub-collection of recent prices.
        const policy = (await this.getPolicy()).physics;
        const pricesSnap = await db.collection('zap_derivatives')
            .doc(derivativeId)
            .collection('price_history')
            .orderBy('timestamp', 'desc')
            .limit(10)
            .get();
        if (pricesSnap.empty)
            return;
        const prices = pricesSnap.docs.map(d => d.data().price);
        const start = prices[prices.length - 1];
        const drift = Math.abs(newPrice - start) / start;
        if (drift > policy.CIRCUIT_BREAKER_VOL_REDLINE) {
            await this.triggerBreaker(derivativeId, 'RED', 'Flash Volatility Redline Exceeded', drift);
        }
        else if (drift > policy.CIRCUIT_BREAKER_VOL_YELLOW) {
            await this.triggerBreaker(derivativeId, 'YELLOW', 'Volatility Spike Threshold', drift);
        }
    },
    async triggerBreaker(derivativeId, status, reason, volatility) {
        await db.collection('zap_system_status').doc(derivativeId).set({
            status,
            reason,
            volatilitySnapshot: volatility,
            lastTriggeredAt: Timestamp.now()
        });
        logger.warn(`[CIRCUIT_BREAKER] ${status} triggered for ${derivativeId}: ${reason}`);
    },
    async isActionAllowed(agentId, action, amount) {
        const policy = await this.getPolicy();
        if (policy.killSwitchActive) {
            return { allowed: false, reason: 'Global Kill-Switch is ACTIVE.' };
        }
        if (action === 'place_order' || action === 'execute_trade') {
            const limit = await this.getRiskAdjustedLimit(agentId, policy);
            if (amount > limit) {
                return { allowed: false, reason: `Amount ${amount} exceeds dynamic risk limit of ${limit}` };
            }
        }
        return { allowed: true };
    },
    async getRiskAdjustedLimit(agentId, policy) {
        let limit = policy.maxAmountPerTrade;
        const agentDoc = await db.collection('agent_capital').doc(agentId).get();
        if (agentDoc.exists) {
            const data = agentDoc.data();
            const level = data?.level || 'Novice';
            limit *= policy.reputationMultipliers[level] || 1;
        }
        return limit;
    }
};
//# sourceMappingURL=governance.js.map