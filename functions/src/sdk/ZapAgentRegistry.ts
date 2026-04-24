import { ZapAgent } from './ZapAgent.js';
import { ZapSDK } from './ZapSDK.js';

export type AgentFactory = (sdk: ZapSDK, userId: string) => ZapAgent;

export class ZapAgentRegistry {
    private static instance: ZapAgentRegistry;
    private agents: Map<string, AgentFactory> = new Map();

    private constructor() { }

    static getInstance(): ZapAgentRegistry {
        if (!ZapAgentRegistry.instance) {
            ZapAgentRegistry.instance = new ZapAgentRegistry();
        }
        return ZapAgentRegistry.instance;
    }

    registerAgent(type: string, factory: AgentFactory) {
        this.agents.set(type, factory);
    }

    createAgent(type: string, sdk: ZapSDK, userId: string): ZapAgent {
        const factory = this.agents.get(type);
        if (!factory) {
            throw new Error(`[ZapAgentRegistry] No agent strategy registered for type: ${type}`);
        }
        return factory(sdk, userId);
    }

    getRegisteredTypes(): string[] {
        return Array.from(this.agents.keys());
    }

    hasAgent(type: string): boolean {
        return this.agents.has(type);
    }
}

export const zapAgentRegistry = ZapAgentRegistry.getInstance();
