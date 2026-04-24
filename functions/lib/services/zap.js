import { db } from '../firebaseInit.js';
import { logger } from '../lib/utils.js';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { governanceService } from './governance.js';
export const SYSTEM_POOL = 'system_pool';
export const zapService = {
    async createDerivative(data) {
        const basePrice = 1.0; // Default base price
        const derivativeData = {
            ...data,
            circulatingSupply: 0,
            currentPrice: basePrice,
            basePrice: basePrice,
            marketCap: 0,
            liquidityTotal: 0,
            phase: 'bonding',
            launchConfig: {
                minReputation: 0,
                vestingPeriod: 24,
                maxPurchaseLimit: data.totalSupply * 0.1
            },
            hypeMultiplier: 1,
            volatilityFactor: 0.05,
            createdAt: Timestamp.now(),
            metrics: {
                demand: 0,
                velocity: 0,
                popularity: 0,
                totalTrades: 0,
                allTimeHigh: basePrice,
                allTimeLow: basePrice,
                peakHype: 1,
                priceDecayHalflife: 24,
                marketMood: 0,
                tradeDensity: 0,
                priceDelta: 0,
                lastPattern: 'stable'
            }
        };
        const docRef = await db.collection('zap_derivatives').add(derivativeData);
        return { id: docRef.id, ...derivativeData };
    },
    async calculateNewPrice(derivative, tradeAmount, tradeType) {
        const policy = await governanceService.getPolicy();
        const physics = policy.physics;
        const { basePrice, circulatingSupply, volatilityFactor } = derivative;
        // INDUSTRIAL PHYSICS: Virtual Depth Engine
        // Price resistance increases as supply grows or velocity spikes.
        const liquidityResistance = 1 + ((derivative.metrics?.velocity || 0) / 10000);
        const k = physics.DEFAULT_BONDING_SLOPE;
        const newSupply = tradeType === 'buy'
            ? circulatingSupply + tradeAmount
            : Math.max(0, circulatingSupply - tradeAmount);
        // Linear base bonding curve
        let price = basePrice + (k * newSupply);
        price *= (derivative.hypeMultiplier || 1);
        // Dynamic Volatility impact with real liquidity awareness
        const velocityImpact = (derivative.metrics?.velocity || 0) / 1000 * (volatilityFactor || physics.DEFAULT_VOLATILITY_FACTOR) * liquidityResistance;
        const trendImpact = derivative.metrics?.lastPattern === 'pump' ? 1.02 : (derivative.metrics?.lastPattern === 'dump' ? 0.98 : 1);
        // Physical Depth: TVL-based resistance
        const tvl = derivative.liquidityTotal || (circulatingSupply * derivative.currentPrice);
        const depthResistance = 1 / (1 + (tvl / 1000000)); // Price harder to move as TVL grows
        price *= (1 + (velocityImpact * depthResistance)) * trendImpact;
        return Math.max(basePrice, price);
    },
    detectPattern(currentPrice, prevPrice, hype) {
        const delta = (currentPrice - prevPrice) / prevPrice;
        if (delta > 0.05 && hype > 1.2)
            return 'pump';
        if (delta < -0.05)
            return 'dump';
        if (delta > 0.02)
            return 'rally';
        return 'stable';
    },
    async executeTrade(tradeData) {
        const { derivativeId, amount, type, buyerId } = tradeData;
        try {
            const govCheck = await governanceService.isActionAllowed(buyerId, 'execute_trade', amount);
            if (!govCheck.allowed)
                throw new Error(`Governance Reject: ${govCheck.reason}`);
            const statusDoc = await db.collection('zap_system_status').doc(derivativeId).get();
            if (statusDoc.exists && statusDoc.data()?.status === 'RED') {
                throw new Error("Market Halted: Circuit breaker is RED.");
            }
            return await db.runTransaction(async (transaction) => {
                const derivativeRef = db.collection('zap_derivatives').doc(derivativeId);
                const derivativeSnap = await transaction.get(derivativeRef);
                if (!derivativeSnap.exists)
                    throw new Error("Derivative does not exist!");
                const derivative = derivativeSnap.data();
                const prevPrice = derivative.currentPrice;
                const newPrice = await this.calculateNewPrice(derivative, amount, type);
                const priceDelta = newPrice - prevPrice;
                const pattern = this.detectPattern(newPrice, prevPrice, derivative.hypeMultiplier);
                // Real Sentiment Synthesis (Market Mood)
                const marketMood = Math.tanh(priceDelta / (prevPrice * 0.1 || 1));
                transaction.update(derivativeRef, {
                    circulatingSupply: FieldValue.increment(type === 'buy' ? amount : -amount),
                    currentPrice: newPrice,
                    'metrics.demand': FieldValue.increment(type === 'buy' ? 1 : -1),
                    'metrics.velocity': FieldValue.increment(amount),
                    'metrics.totalTrades': FieldValue.increment(1),
                    'metrics.allTimeHigh': Math.max(derivative.metrics?.allTimeHigh || 0, newPrice),
                    'metrics.allTimeLow': Math.min(derivative.metrics?.allTimeLow || newPrice, newPrice),
                    'metrics.priceDelta': priceDelta,
                    'metrics.lastPattern': pattern,
                    'metrics.marketMood': marketMood,
                    marketCap: newPrice * (derivative.totalSupply || 0),
                    liquidityTotal: FieldValue.increment(type === 'buy' ? amount * newPrice : -(amount * newPrice))
                });
                const tradeRef = db.collection('zap_trades').doc();
                const tradeRecord = {
                    ...tradeData,
                    price: newPrice,
                    priceDelta,
                    hypeAtTrade: derivative.hypeMultiplier || 1,
                    marketMoodAtTrade: marketMood,
                    patternDetected: pattern,
                    timestamp: Timestamp.now()
                };
                // Explicitly provide 2 arguments to Transaction.set
                transaction.set(tradeRef, tradeRecord);
                await governanceService.checkVolatility(derivativeId, newPrice);
                return { id: tradeRef.id, price: newPrice };
            });
        }
        catch (error) {
            logger.error(`[Zap] Trade execution failed`, error);
            throw error;
        }
    }
};
//# sourceMappingURL=zap.js.map