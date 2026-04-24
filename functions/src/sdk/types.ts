import { Timestamp } from 'firebase-admin/firestore';
import { ZapDerivative, ZapTrade, LimitOrder } from '../types/zap.js';

export type { ZapDerivative, ZapTrade, LimitOrder };

export interface AgentTool {
    name: string;
    description: string;
    parameters: {
        type: 'object';
        properties: Record<string, any>;
        required: string[];
    };
}

export interface AgentPermissions {
    maxAmountPerTrade: number;
    dailyVolumeLimit: number;
    allowedTools: string[];
}

export interface StrategicGoal {
    type: 'ACCUMULATE' | 'DISTRIBUTE' | 'LIQUIDITY_PROVISION' | 'ARBITRAGE' | 'REPUTATION_GROWTH';
    target: number;
    current: number;
    priority: number;
    deadline?: number;
}

export interface AgentMission {
    id: string;
    description: string;
    goals: StrategicGoal[];
    status: 'planned' | 'active' | 'completed' | 'failed';
    config: Record<string, any>;
}

export interface AgentContext {
    userId: string;
    derivative: ZapDerivative;
    capital: any;
    reputation: any;
    signals: any[];
    intelligence: any;
    persistentState: any;
    swarmConsensus: any;
}

export interface ZapToolMap {
    'place_order': {
        derivativeId: string;
        type: 'buy' | 'sell';
        orderType: 'limit' | 'market';
        amount: number;
        price?: number;
    };
    'broadcast_signal': {
        derivativeId: string;
        type: 'ORDER_INTENT' | 'MARKET_CRASH_WARNING' | 'LIQUIDITY_DEPTH_OBSERVATION';
        content: string;
        priority: 'low' | 'medium' | 'high';
    };
    'seek_signals': {
        derivativeId: string;
    };
    'set_trailing_stop': {
        derivativeId: string;
        type: 'buy' | 'sell';
        amount: number;
        trailingDelta: number;
    };
    'set_oco_order': {
        derivativeId: string;
        type: 'buy' | 'sell';
        amount: number;
        limitPrice: number;
        stopPrice: number;
    };
    'get_market_intelligence': {
        derivativeId: string;
    };
    'cancel_order': {
        orderId: string;
    };
    'get_agent_status': {};
    'get_top_influencers': {
        count?: number;
    };
    'remember': {
        state: any;
    };
    'recall': {};
    'register_macro': {
        macroName: string;
        toolSequences: Array<{ tool: string; args: any }>;
    };
    'sync_state': {
        state: any;
    };
}

export type ZapToolName = keyof ZapToolMap;
