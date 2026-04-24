import { ZapSDK } from './ZapSDK.js';
import { AgentPermissions, AgentTool } from './types.js';

export class ZapAgentToolbox {
    private sdk: ZapSDK;
    private permissions: Record<string, AgentPermissions> = {};

    constructor(sdk: ZapSDK) {
        this.sdk = sdk;
    }

    setPermissions(userId: string, perms: AgentPermissions) {
        this.permissions[userId] = perms;
    }

    async dispatchToolCall(
        userId: string,
        toolName: string,
        args: any,
        thought: string = ''
    ): Promise<any> {
        console.log(`[BackendToolbox] Dispatching ${toolName} for ${userId}`, args);

        const { agentService } = await import('../services/agents.js');
        const { zapService } = await import('../services/zap.js');
        const { governanceService } = await import('../services/governance.js');

        // Safety & Governance Checks
        const amount = typeof args === 'number' ? args : (args?.amount || 0);
        const govCheck = await governanceService.isActionAllowed(userId, toolName, amount);
        if (!govCheck.allowed) {
            throw new Error(`Execution Blocked by Governance: ${govCheck.reason}`);
        }

        if (thought) {
            await agentService.logThought(userId, args?.derivativeId || 'system', thought, { toolName, args });
        }

        switch (toolName) {
            case 'place_order':
                return await this.sdk.placeLimitOrder({ ...args, userId });

            case 'cancel_order':
                return await this.sdk.cancelOrder(args.orderId);

            case 'broadcast_signal':
                // For now, signals are logged as thoughts or handled by a dedicated signal collection
                await agentService.logThought(userId, args.derivativeId, `SIGNAL_${args.type}: ${args.content}`, { priority: args.priority });
                return { success: true };

            case 'seek_signals':
                // Query agent_thoughts for recent signals
                return { signals: [] }; // Implementation detail: would query FS

            case 'get_agent_status':
                const memory = await agentService.getMemory(userId, 'default');
                return { userId, status: 'active', memory };

            case 'remember':
            case 'sync_state':
                await agentService.saveMemory(userId, args.agentId || 'default', args.state || args.memory);
                return { success: true };

            case 'recall':
                const state = await agentService.getMemory(userId, 'default');
                return state || {};

            case 'get_market_intelligence':
                // Placeholder for LLM-driven market analysis
                return { trend: 'neutral', confidence: 0.5 };

            case 'set_trailing_stop':
            case 'set_oco_order':
                // Advanced strategies would be handled by a strategy worker/service
                console.log(`[BackendToolbox] Strategy ${toolName} registered for ${userId}`);
                return { success: true, strategyId: 'strat_' + Date.now() };

            default:
                throw new Error(`Tool ${toolName} not yet implemented in backend toolbox`);
        }
    }
}
