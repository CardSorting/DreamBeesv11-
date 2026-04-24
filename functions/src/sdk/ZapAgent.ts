import { ZapSDK } from './ZapSDK.js';
import { ZapAgentToolbox } from './ZapAgentToolbox.js';
import { ZapDerivative, ZapToolMap, ZapToolName, StrategicGoal, AgentMission, AgentContext } from './types.js';
import { zapAgentRegistry } from './ZapAgentRegistry.js';
import { EventEmitter } from 'events';

/**
 * DECORATOR: Zero-Boilerplate Agent Registration
 */
export function AgentStrategy(id: string) {
    return function (constructor: Function) {
        zapAgentRegistry.registerAgent(id, (sdk, userId) => {
            const agent = new (constructor as any)(sdk, userId);
            return agent;
        });
    };
}

export abstract class ZapAgent {
    protected sdk: ZapSDK;
    protected userId: string;
    protected toolbox: ZapAgentToolbox;
    protected _state: any = {};
    protected context: AgentContext | null = null;
    protected mission: AgentMission | null = null;
    protected isActive: boolean = true;
    protected throttleTrades: boolean = false;

    public get active(): boolean {
        return this.isActive;
    }

    constructor(sdk: ZapSDK, userId: string) {
        this.sdk = sdk;
        this.userId = userId;
        this.toolbox = sdk.agentTools;
    }

    /**
     * Semantic Getters for simpler strategy logic
     */
    get price(): number { return this.context?.derivative.currentPrice || 0; }
    get balance(): number { return this.context?.capital.balance || 0; }
    get stakedBalance(): number { return this.context?.capital.stakedBalance || 0; }
    get pnl(): number { return this.context?.capital.pnl || 0; }
    get riskLimit(): number { return this.context?.capital.riskLimit || 1; }
    get tier(): number { return this.context?.capital.tier || 1; }

    get ath(): number { return this.context?.derivative.metrics?.allTimeHigh || this.price; }
    get mood(): number { return this.context?.derivative.metrics?.marketMood || 0; }
    get marketVelocity(): number { return this.context?.derivative.metrics?.velocity || 0; }

    protected get state(): any { return this._state; }

    get isTrendingUp(): boolean {
        const metrics = this.context?.derivative.metrics;
        return (metrics?.velocity || 0) > 0 && (metrics?.demand || 0) > 1;
    }

    get isHighlyVolatile(): boolean {
        return (this.context?.derivative.volatilityFactor || 0) > 0.15;
    }

    /**
     * Trading Primitives
     */
    protected async buy(amount: number, price?: number, thought?: string) {
        if (!this.isActive) return;
        return await this.callTool('place_order', {
            derivativeId: this.context!.derivative.id,
            type: 'buy',
            orderType: price ? 'limit' : 'market',
            amount,
            price
        }, thought);
    }

    protected async sell(amount: number, price?: number, thought?: string) {
        if (!this.isActive) return;
        return await this.callTool('place_order', {
            derivativeId: this.context!.derivative.id,
            type: 'sell',
            orderType: price ? 'limit' : 'market',
            amount,
            price
        }, thought);
    }

    protected abstract planMission(context: AgentContext): Promise<AgentMission | null>;
    protected abstract selfOptimize(context: AgentContext): Promise<void>;
    protected abstract tick(context: AgentContext): Promise<void>;

    async executeTick(context: AgentContext) {
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

    protected async liquidateAndPause() {
        this.isActive = false;
        console.warn(`[AgentSafety] EMERGENCY HALT for ${this.userId}. Liquidating positions...`);
        // Backend implementation of liquidation logic
    }

    protected async callTool<T extends ZapToolName>(
        toolName: T,
        args: ZapToolMap[T],
        thought?: string
    ) {
        return await this.toolbox.dispatchToolCall(this.userId, toolName as string, args, thought || '');
    }

    protected async remember(state: any) {
        this._state = { ...this._state, ...state };
        await this.callTool('remember', { state });
    }

    protected async recall() {
        return this._state;
    }

    private events = new EventEmitter();
    on(event: string, listener: (...args: any[]) => void) { this.events.on(event, listener); }
    emit(event: string, ...args: any[]) { this.events.emit(event, ...args); }

    getUserId() { return this.userId; }
}
