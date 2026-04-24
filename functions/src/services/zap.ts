import { db } from '../firebaseInit.js';
import { logger } from '../lib/utils.js';

import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { ZapDerivative, ZapTrade } from '../types/zap.js';
import { governanceService, SystemPolicy } from './governance.js';



export const SYSTEM_POOL = 'system_pool';

export const zapService = {
    async createDerivative(data: Omit<ZapDerivative, 'createdAt' | 'metrics' | 'circulatingSupply' | 'currentPrice' | 'hypeMultiplier' | 'volatilityFactor' | 'basePrice'>) {
        const basePrice = 1.0; // Default base price
        const derivativeData: Omit<ZapDerivative, 'id'> = {
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

    async calculateNewPrice(derivative: ZapDerivative, tradeAmount: number, tradeType: 'buy' | 'sell', policy: SystemPolicy): Promise<number> {
        const physics = policy.physics;

        const {
            basePrice,
            circulatingSupply,
            volatilityFactor
        } = derivative;

        // INDUSTRIAL PHYSICS: Virtual Depth Engine
        const liquidityResistance = 1 + ((derivative.metrics?.velocity || 0) / 10000);
        const k = physics.DEFAULT_BONDING_SLOPE;

        const newSupply = tradeType === 'buy'
            ? circulatingSupply + tradeAmount
            : Math.max(0, circulatingSupply - tradeAmount);

        // Linear base bonding curve
        let price = basePrice + (k * newSupply);
        price *= (derivative.hypeMultiplier || 1);

        // Dynamic Volatility impact
        const velocityImpact = (derivative.metrics?.velocity || 0) / 1000 * (volatilityFactor || physics.DEFAULT_VOLATILITY_FACTOR) * liquidityResistance;
        const trendImpact = derivative.metrics?.lastPattern === 'pump' ? 1.02 : (derivative.metrics?.lastPattern === 'dump' ? 0.98 : 1);

        const tvl = derivative.liquidityTotal || (circulatingSupply * derivative.currentPrice);
        const depthResistance = 1 / (1 + (tvl / 1000000));

        price *= (1 + (velocityImpact * depthResistance)) * trendImpact;

        return Math.max(basePrice, price);
    },


    detectPattern(currentPrice: number, prevPrice: number, hype: number): 'pump' | 'dump' | 'stable' | 'rally' {
        const delta = (currentPrice - prevPrice) / prevPrice;
        if (delta > 0.05 && hype > 1.2) return 'pump';
        if (delta < -0.05) return 'dump';
        if (delta > 0.02) return 'rally';
        return 'stable';
    },

    async executeTrade(tradeData: Omit<ZapTrade, 'timestamp' | 'hypeAtTrade' | 'price' | 'priceDelta' | 'marketMoodAtTrade' | 'patternDetected'>): Promise<{ id: string; price: number }> {
        const { derivativeId, amount, type, buyerId } = tradeData;

        try {
            // FAST-PATH: Policy caching eliminates cold-start reads
            const policy = await governanceService.getPolicy();

            if (policy.killSwitchActive) throw new Error("Global Kill-Switch ACTIVE");

            const govCheck = await governanceService.isActionAllowed(buyerId, 'execute_trade', amount, policy);
            if (!govCheck.allowed) throw new Error(`Governance Reject: ${govCheck.reason}`);

            return await db.runTransaction(async (transaction) => {
                const derivativeRef = db.collection('zap_derivatives').doc(derivativeId);
                const derivativeSnap = await transaction.get(derivativeRef);

                if (!derivativeSnap.exists) throw new Error("Derivative does not exist!");
                const derivative = derivativeSnap.data() as ZapDerivative;

                // FAST-PATH: Native status check (zero-read)
                if (derivative.status === 'RED') {
                    throw new Error("Market Halted: Circuit breaker is RED.");
                }

                const prevPrice = derivative.currentPrice;
                const newPrice = await this.calculateNewPrice(derivative, amount, type, policy);
                const priceDelta = newPrice - prevPrice;

                const pattern = this.detectPattern(newPrice, prevPrice, derivative.hypeMultiplier);
                const marketMood = Math.tanh(priceDelta / (prevPrice * 0.1 || 1));

                // Maintain Native Price history (FIFO, max 5)
                const recentPrices = derivative.metrics?.recentPrices || [];
                recentPrices.push(newPrice);
                if (recentPrices.length > 5) recentPrices.shift();

                // FAST-PATH: Calculate new status without extra I/O
                const newStatus = await governanceService.checkVolatility(derivativeId, newPrice, recentPrices);

                transaction.update(derivativeRef, {
                    circulatingSupply: FieldValue.increment(type === 'buy' ? amount : -amount),
                    currentPrice: newPrice,
                    status: newStatus || 'ACTIVE',
                    'metrics.demand': FieldValue.increment(type === 'buy' ? 1 : -1),
                    'metrics.velocity': FieldValue.increment(amount),
                    'metrics.totalTrades': FieldValue.increment(1),
                    'metrics.allTimeHigh': Math.max(derivative.metrics?.allTimeHigh || 0, newPrice),
                    'metrics.allTimeLow': Math.min(derivative.metrics?.allTimeLow || newPrice, newPrice),
                    'metrics.priceDelta': priceDelta,
                    'metrics.lastPattern': pattern,
                    'metrics.marketMood': marketMood,
                    'metrics.recentPrices': recentPrices,
                    marketCap: newPrice * (derivative.totalSupply || 0),
                    liquidityTotal: FieldValue.increment(type === 'buy' ? amount * newPrice : -(amount * newPrice))
                });

                // HYBRID TURBO: Skip ledger creation for ultra-high velocity
                if (tradeData.turbo) {
                    return { id: `turbo_${Date.now()}`, price: newPrice };
                }

                const tradeRef = db.collection('zap_trades').doc();
                const tradeRecord: ZapTrade = {
                    ...tradeData,
                    price: newPrice,
                    priceDelta,
                    hypeAtTrade: derivative.hypeMultiplier || 1,
                    marketMoodAtTrade: marketMood,
                    patternDetected: pattern,
                    timestamp: Timestamp.now()
                };

                transaction.set(tradeRef, tradeRecord);

                return { id: tradeRef.id, price: newPrice };
            });

        } catch (error: any) {
            logger.error(`[Zap] Trade execution failed`, error);
            throw error;
        }
    }

};
