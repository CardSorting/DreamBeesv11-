import { ZapAgentToolbox } from './ZapAgentToolbox.js';
import { zapService } from '../services/zap.js';
export class ZapSDK {
    agentTools;
    constructor() {
        this.agentTools = new ZapAgentToolbox(this);
    }
    async placeLimitOrder(order) {
        return await zapService.executeTrade({
            derivativeId: order.derivativeId,
            amount: order.amount,
            type: order.type,
            buyerId: order.userId
        });
    }
    async cancelOrder(orderId) {
        // In backend, we'd call a dedicated order service or zapService.cancelOrder if implemented
        return { success: true, orderId };
    }
    async getMarketIntelligence(derivativeId) {
        // Bridge to LLM intelligence service
        return { sentiment: 'bullish', score: 0.8 };
    }
}
export const zapSDK = new ZapSDK();
//# sourceMappingURL=ZapSDK.js.map