var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
import { ZapAgent, AgentStrategy } from '../ZapAgent.js';
let WhaleAgent = (() => {
    let _classDecorators = [AgentStrategy('whale')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ZapAgent;
    var WhaleAgent = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            WhaleAgent = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        static getPermissions() {
            return {
                maxAmountPerTrade: 5000,
                dailyVolumeLimit: 1000000,
                allowedTools: ['place_order', 'remember', 'recall', 'broadcast_signal', 'get_market_intelligence']
            };
        }
        async planMission(context) {
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
        async selfOptimize(context) {
            if (!this.mission)
                return;
            const drawdown = Math.abs(context.capital.pnl / context.capital.balance);
            if (drawdown > 0.05) {
                this.mission.config.buyAggression *= 0.8;
                console.log(`[WhaleOptimize] ${this.userId} reducing aggression due to drawdown.`);
            }
        }
        async tick(context) {
            const { derivative, capital, userId } = context;
            const { currentPrice, metrics } = derivative;
            if (!this.mission)
                return;
            let amount = 0;
            let type = 'buy';
            let thought = '';
            if (metrics.velocity > 100 || currentPrice > this.mission.goals[0].target) {
                const maxSellRange = Math.min(capital.balance * 0.2);
                amount = Math.max(1, Math.floor(maxSellRange));
                type = 'sell';
                thought = `Mission Goal reached or Velocity peak. Taking profits for mission ${this.mission.id}`;
                this.mission.status = 'completed';
            }
            else if (derivative.hypeMultiplier >= 1) {
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
    };
    return WhaleAgent = _classThis;
})();
export { WhaleAgent };
//# sourceMappingURL=WhaleAgent.js.map