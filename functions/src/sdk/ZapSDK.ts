import { ZapAgentToolbox } from './ZapAgentToolbox.js';
import { zapService } from '../services/zap.js';

export class ZapSDK {
    public agentTools: ZapAgentToolbox;

    constructor() {
        this.agentTools = new ZapAgentToolbox(this);
    }

    async placeLimitOrder(order: any) {
        return await zapService.executeTrade({
            derivativeId: order.derivativeId,
            amount: order.amount,
            type: order.type,
            buyerId: order.userId
        } as any);
    }

    async cancelOrder(orderId: string) {
        // In backend, we'd call a dedicated order service or zapService.cancelOrder if implemented
        return { success: true, orderId };
    }

    async getMarketIntelligence(derivativeId: string) {
        // Bridge to LLM intelligence service
        return { sentiment: 'bullish', score: 0.8 };
    }
}

export const zapSDK = new ZapSDK();

