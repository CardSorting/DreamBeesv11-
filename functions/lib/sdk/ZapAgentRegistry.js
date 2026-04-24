export class ZapAgentRegistry {
    static instance;
    agents = new Map();
    constructor() { }
    static getInstance() {
        if (!ZapAgentRegistry.instance) {
            ZapAgentRegistry.instance = new ZapAgentRegistry();
        }
        return ZapAgentRegistry.instance;
    }
    registerAgent(type, factory) {
        this.agents.set(type, factory);
    }
    createAgent(type, sdk, userId) {
        const factory = this.agents.get(type);
        if (!factory) {
            throw new Error(`[ZapAgentRegistry] No agent strategy registered for type: ${type}`);
        }
        return factory(sdk, userId);
    }
    getRegisteredTypes() {
        return Array.from(this.agents.keys());
    }
    hasAgent(type) {
        return this.agents.has(type);
    }
}
export const zapAgentRegistry = ZapAgentRegistry.getInstance();
//# sourceMappingURL=ZapAgentRegistry.js.map