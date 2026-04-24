import { db } from '../firebaseInit.js';
import { logger } from '../lib/utils.js';
import { Timestamp } from 'firebase-admin/firestore';

export interface SystemPolicy {
    killSwitchActive: boolean;
    maxAmountPerTrade: number;
    dailyVolumeLimit: number;
    lastUpdated: Timestamp;
    updatedBy: string;
    maxSlippage: number;
    platformFee: number;
    minReputationForLiveTrading: number;
    reputationMultipliers: Record<string, number>;
    physics: {
        DEFAULT_BONDING_SLOPE: number;
        MIN_VOLATILITY_FACTOR: number;
        DEFAULT_VOLATILITY_FACTOR: number;
        PUMP_THRESHOLD: number;
        DUMP_THRESHOLD: number;
        STALE_ORDER_THRESHOLD_MS: number;
        DEFAULT_BASE_PRICE: number;
        DEFAULT_VOLATILITY: number;
        CIRCUIT_BREAKER_VOL_REDLINE: number;
        CIRCUIT_BREAKER_VOL_YELLOW: number;
    };
}

const CACHE_TTL_MS = 60000; // 60 seconds
let cachedPolicy: SystemPolicy | null = null;
let lastFetchTime = 0;

const AGENT_LIMIT_CACHE_TTL = 300000; // 5 minutes
const agentLimitCache: Record<string, { limit: number; timestamp: number }> = {};

const DEFAULT_POLICY: Omit<SystemPolicy, 'lastUpdated'> = {
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
    async getPolicy(): Promise<SystemPolicy> {
        const now = Date.now();
        if (cachedPolicy && (now - lastFetchTime < CACHE_TTL_MS)) {
            return cachedPolicy;
        }

        const doc = await db.collection('zap_governance').doc('global_policy').get();
        if (doc.exists) {
            cachedPolicy = doc.data() as SystemPolicy;
            lastFetchTime = now;
            return cachedPolicy;
        }
        // Initialize if not exists
        const policy = { ...DEFAULT_POLICY, lastUpdated: Timestamp.now() } as SystemPolicy;
        await db.collection('zap_governance').doc('global_policy').set(policy);
        cachedPolicy = policy;
        lastFetchTime = now;
        return policy;
    },

    async checkVolatility(derivativeId: string, newPrice: number, cachedRecentPrices?: number[]): Promise<'ACTIVE' | 'YELLOW' | 'RED' | null> {
        // FAST-PATH: Use cached recent prices if available to avoid extra DB reads
        const policy = (await this.getPolicy()).physics;

        let prices: number[] = [];

        if (cachedRecentPrices && cachedRecentPrices.length > 0) {
            prices = cachedRecentPrices;
        } else {
            // SLOW-PATH: Fallback for older derivatives (auditability mode)
            const pricesSnap = await db.collection('zap_derivatives')
                .doc(derivativeId)
                .collection('price_history')
                .orderBy('timestamp', 'desc')
                .limit(10)
                .get();

            if (pricesSnap.empty) return 'ACTIVE';
            prices = pricesSnap.docs.map(d => d.data().price);
        }

        const start = prices[prices.length - 1];
        const drift = Math.abs(newPrice - start) / start;

        if (drift > policy.CIRCUIT_BREAKER_VOL_REDLINE) {
            return 'RED';
        } else if (drift > policy.CIRCUIT_BREAKER_VOL_YELLOW) {
            return 'YELLOW';
        }

        return 'ACTIVE';
    },

    async triggerBreaker(derivativeId: string, status: 'YELLOW' | 'RED', reason: string, volatility: number) {
        await db.collection('zap_system_status').doc(derivativeId).set({
            status,
            reason,
            volatilitySnapshot: volatility,
            lastTriggeredAt: Timestamp.now()
        });
        logger.warn(`[CIRCUIT_BREAKER] ${status} triggered for ${derivativeId}: ${reason}`);
    },

    async isActionAllowed(agentId: string, action: string, amount: number, providedPolicy?: SystemPolicy): Promise<{ allowed: boolean; reason?: string }> {
        const policy = providedPolicy || await this.getPolicy();
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

    async getRiskAdjustedLimit(agentId: string, policy: SystemPolicy): Promise<number> {
        const now = Date.now();
        if (agentLimitCache[agentId] && (now - agentLimitCache[agentId].timestamp < AGENT_LIMIT_CACHE_TTL)) {
            return agentLimitCache[agentId].limit;
        }

        let limit = policy.maxAmountPerTrade;
        const agentDoc = await db.collection('agent_capital').doc(agentId).get();

        if (agentDoc.exists) {
            const data = agentDoc.data();
            const level = data?.level || 'Novice';
            limit *= policy.reputationMultipliers[level] || 1;
        }

        agentLimitCache[agentId] = { limit, timestamp: now };
        return limit;
    }
};
