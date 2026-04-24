import { ZapAgent, AgentStrategy } from '../ZapAgent.js';
import { AgentContext, AgentMission, AgentPermissions } from '../types.js';


@AgentStrategy('scalper')
export class ScalperAgent extends ZapAgent {
    static getPermissions(): AgentPermissions {
        return {
            maxAmountPerTrade: 500,
            dailyVolumeLimit: 200000,
            allowedTools: ['place_order', 'remember', 'recall']
        };
    }

    protected async planMission(context: AgentContext): Promise<AgentMission | null> {
        return {
            id: `scalper_${Date.now()}`,
            description: "High-frequency scalping for small PnL hits",
            status: 'active',
            goals: [],
            config: { profitTarget: 0.012, stopLoss: 0.008 }
        };
    }

    protected async selfOptimize(context: AgentContext): Promise<void> { }

    async tick(context: AgentContext): Promise<void> {
        const { derivative, capital } = context;
        const { currentPrice, metrics } = derivative;

        if (metrics.velocity > 50) {
            await this.buy(100, currentPrice, "Scalping high velocity entry");
        } else if (metrics.velocity < -30) {
            await this.sell(100, currentPrice, "Quick exit on downward pressure");
        }
    }
}
