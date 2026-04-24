import { ZapAgent, AgentStrategy } from '../ZapAgent.js';
import { AgentContext, AgentMission, AgentPermissions } from '../types.js';


@AgentStrategy('whale')
export class WhaleAgent extends ZapAgent {
    static getPermissions(): AgentPermissions {
        return {
            maxAmountPerTrade: 5000,
            dailyVolumeLimit: 1000000,
            allowedTools: ['place_order', 'remember', 'recall', 'broadcast_signal', 'get_market_intelligence']
        };
    }

    protected async planMission(context: AgentContext): Promise<AgentMission | null> {
        const { currentPrice } = context.derivative;
        const targetPrice = currentPrice * 1.5;

        return {
            id: `whale_accumulate_${Date.now()}`,
            description: `Accumulate ${context.derivative.symbol} targeting $${targetPrice.toFixed(2)}`,
            status: 'active',
            goals: [{ type: 'ACCUMULATE', target: targetPrice, current: currentPrice, priority: 1 }],
            config: { buyAggression: 0.15 }
        };
    }

    protected async selfOptimize(context: AgentContext): Promise<void> {
        if (!this.mission) return;
        const drawdown = Math.abs(context.capital.pnl / context.capital.balance);

        if (drawdown > 0.05) {
            this.mission.config.buyAggression *= 0.8;
            console.log(`[WhaleOptimize] ${this.userId} reducing aggression due to drawdown.`);
        }
    }

    async tick(context: AgentContext): Promise<void> {
        const { derivative, capital, userId } = context;
        const { currentPrice, metrics } = derivative;

        if (!this.mission) return;

        let amount = 0;
        let type: 'buy' | 'sell' = 'buy';
        let thought = '';

        if (metrics.velocity > 100 || currentPrice > this.mission.goals[0].target) {
            const maxSellRange = Math.min(capital.balance * 0.2);
            amount = Math.max(1, Math.floor(maxSellRange));
            type = 'sell';
            thought = `Mission Goal reached or Velocity peak. Taking profits for mission ${this.mission.id}`;
            this.mission.status = 'completed';
        } else if (derivative.hypeMultiplier >= 1) {
            const aggression = this.mission.config.buyAggression || 0.15;
            const maxBuyRange = Math.min(capital.balance * aggression);
            if (maxBuyRange >= 1) {
                amount = Math.min(5000, Math.floor(maxBuyRange));
                type = 'buy';
                thought = `Executing mission ${this.mission.id}. Sentiment is stable.`;
            }
        }

        if (amount > 0) {
            await this.buy(amount, type === 'buy' ? Number((currentPrice * 0.99).toFixed(4)) : Number((currentPrice * 1.01).toFixed(4)), thought);
        }
    }
}
