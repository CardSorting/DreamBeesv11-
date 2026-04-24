import { db } from '../firebaseInit.js';
import { logger } from '../lib/utils.js';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
export const agentService = {
    async tickAgents(derivativeId) {
        logger.info(`[AgentService] Ticking agents for derivative: ${derivativeId}`);
        const derivativeRef = db.collection('zap_derivatives').doc(derivativeId);
        const derivativeSnap = await derivativeRef.get();
        if (!derivativeSnap.exists)
            return;
        const derivative = derivativeSnap.data();
        const { zapAgentRegistry } = await import('../sdk/ZapAgentRegistry.js');
        const { ZapSDK } = await import('../sdk/ZapSDK.js');
        await import('../sdk/agents/index.js');
        const botTypes = ['whale', 'scalper'];
        for (const type of botTypes) {
            const botId = `swarm_${type}_${derivativeId.slice(-4)}`;
            try {
                if (zapAgentRegistry.hasAgent(type)) {
                    const sdk = new ZapSDK();
                    const agent = zapAgentRegistry.createAgent(type, sdk, botId);
                    const capitalRes = await db.collection('agent_capital').doc(botId).get();
                    const capital = capitalRes.exists ? capitalRes.data() : { balance: 10000, pnl: 0, status: 'active' };
                    const memory = await this.getMemory(botId, type);
                    await agent.executeTick({
                        userId: botId,
                        derivative,
                        capital,
                        reputation: { score: 50 },
                        signals: [],
                        intelligence: {},
                        persistentState: memory,
                        swarmConsensus: {}
                    });
                }
            }
            catch (err) {
                logger.error(`[AgentSwarm] Failed to tick agent ${botId}:`, err);
            }
        }
    },
    async manageCapital(userId, delta) {
        const capitalRef = db.collection('agent_capital').doc(userId);
        await capitalRef.set({
            balance: FieldValue.increment(delta),
            updatedAt: Timestamp.now()
        }, { merge: true });
    },
    async executeSwarmTick(derivativeId) {
        // Triggered after each trade to update agent world-view
        logger.info(`[AgentSwarm] Triggering global tick for ${derivativeId}`);
        // ... Logic to simulate agent reactions to price changes
    },
    async logThought(userId, derivativeId, thought, context) {
        await db.collection('agent_thoughts').add({
            userId,
            derivativeId,
            thought,
            context,
            timestamp: Timestamp.now()
        });
    },
    async saveMacro(userId, name, sequence) {
        await db.collection('agent_macros').doc(`${userId}_${name}`).set({
            userId,
            name,
            sequence,
            updatedAt: Timestamp.now()
        });
    },
    async loadMacros(userId) {
        const snap = await db.collection('agent_macros').where('userId', '==', userId).get();
        return snap.docs.map(doc => doc.data());
    },
    async saveMemory(userId, agentId, memory) {
        await db.collection('agent_memory').doc(`${userId}_${agentId}`).set({
            userId,
            agentId,
            memory,
            updatedAt: Timestamp.now()
        }, { merge: true });
    },
    async getMemory(userId, agentId) {
        const doc = await db.collection('agent_memory').doc(`${userId}_${agentId}`).get();
        return doc.exists ? doc.data()?.memory : null;
    },
    async decideAgentAction(agentId, derivativeId, agentType) {
        // This is the bridge to the LLM-driven decision engine
        // In production, this would call handleDecideAgentAction
        logger.info(`[AgentService] Agent ${agentId} (${agentType}) deciding action for ${derivativeId}`);
        // Placeholder for real decision logic - would normally involve VertexAI or similar
    }
};
//# sourceMappingURL=agents.js.map