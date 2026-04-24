import { zapAgentRegistry } from './ZapAgentRegistry.js';
import { EventEmitter } from 'events';
/**
 * DECORATOR: Zero-Boilerplate Agent Registration
 */
export function AgentStrategy(id) {
    return function (constructor) {
        zapAgentRegistry.registerAgent(id, (sdk, userId) => {
            const agent = new constructor(sdk, userId);
            return agent;
        });
    };
}
export class ZapAgent {
    sdk;
    userId;
    toolbox;
    _state = {};
    context = null;
    mission = null;
    isActive = true;
    throttleTrades = false;
    get active() {
        return this.isActive;
    }
    constructor(sdk, userId) {
        this.sdk = sdk;
        this.userId = userId;
        this.toolbox = sdk.agentTools;
    }
    /**
     * Semantic Getters for simpler strategy logic
     */
    get price() { return this.context?.derivative.currentPrice || 0; }
    get balance() { return this.context?.capital.balance || 0; }
    get stakedBalance() { return this.context?.capital.stakedBalance || 0; }
    get pnl() { return this.context?.capital.pnl || 0; }
    get riskLimit() { return this.context?.capital.riskLimit || 1; }
    get tier() { return this.context?.capital.tier || 1; }
    get ath() { return this.context?.derivative.metrics?.allTimeHigh || this.price; }
    get mood() { return this.context?.derivative.metrics?.marketMood || 0; }
    get marketVelocity() { return this.context?.derivative.metrics?.velocity || 0; }
    get state() { return this._state; }
    get isTrendingUp() {
        const metrics = this.context?.derivative.metrics;
        return (metrics?.velocity || 0) > 0 && (metrics?.demand || 0) > 1;
    }
    get isHighlyVolatile() {
        return (this.context?.derivative.volatilityFactor || 0) > 0.15;
    }
    /**
     * Trading Primitives
     */
    async buy(amount, price, thought) {
        if (!this.isActive)
            return;
        return await this.callTool('place_order', {
            derivativeId: this.context.derivative.id,
            type: 'buy',
            orderType: price ? 'limit' : 'market',
            amount,
            price
        }, thought);
    }
    async sell(amount, price, thought) {
        if (!this.isActive)
            return;
        return await this.callTool('place_order', {
            derivativeId: this.context.derivative.id,
            type: 'sell',
            orderType: price ? 'limit' : 'market',
            amount,
            price
        }, thought);
    }
    async executeTick(context) {
        const prevPrice = this.price;
        this.context = context;
        this._state = context.persistentState || {};
        if (this.pnl < -(this.stakedBalance * 1.5)) {
            await this.liquidateAndPause();
            return;
        }
        // Safety Auto-Halt: Stop ticking if agent is not active
        if (!this.isActive) {
            console.warn(`[AgentSafety] ${this.userId} ticker suspended.`);
            return;
        }
        // 1. Mission Planning Loop
        if (!this.mission || this.mission.status === 'completed' || this.mission.status === 'failed') {
            this.mission = await this.planMission(context);
            if (this.mission) {
                console.log(`[AgentMission] ${this.userId} locked-in to mission: ${this.mission.description}`);
            }
        }
        // 2. Self-Optimization Loop (Runs every 10 ticks or on PnL events)
        if (Math.random() > 0.9 || this.pnl !== 0) {
            await this.selfOptimize(context);
        }
        // Auto-emit internal price events if changed
        if (prevPrice !== this.price && prevPrice > 0) {
            this.emit('price_update', { price: this.price, prevPrice });
        }
        await this.tick(context);
    }
    async liquidateAndPause() {
        this.isActive = false;
        console.warn(`[AgentSafety] EMERGENCY HALT for ${this.userId}. Liquidating positions...`);
        // Backend implementation of liquidation logic
    }
    async callTool(toolName, args, thought) {
        return await this.toolbox.dispatchToolCall(this.userId, toolName, args, thought || '');
    }
    async remember(state) {
        this._state = { ...this._state, ...state };
        await this.callTool('remember', { state });
    }
    async recall() {
        return this._state;
    }
    events = new EventEmitter();
    on(event, listener) { this.events.on(event, listener); }
    emit(event, ...args) { this.events.emit(event, ...args); }
    getUserId() { return this.userId; }
}
//# sourceMappingURL=ZapAgent.js.map