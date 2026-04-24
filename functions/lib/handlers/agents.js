import { HttpsError } from "firebase-functions/v2/https";
import { VertexAI } from "@google-cloud/vertexai";
import { logger } from "../lib/utils.js";
const vertexAI = new VertexAI({ project: process.env.GCLOUD_PROJECT, location: "us-central1" });
export const handleDecideAgentAction = async (request) => {
    const { style, context, tools } = request.data;
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be logged in.');
    }
    const model = vertexAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
            responseMimeType: "application/json"
        }
    });
    const systemPrompt = `
    You are an autonomous trading agent on the DreamBees Zap Marketplace.
    Your style is: ${style.toUpperCase()}.
    
    AGENT STYLES REFERENCE:
    - WHALE: Massive capital, slow movement, focuses on long-term accumulation and market stability. Sells when velocity is too high.
    - SCALPER: High-frequency, small profits, reacts to tiny price changes (1-2%).
    - HYPE_BOT: Sentiment-driven. Buys when social hype is rising, sells when it peaks.
    - PANIC_SELLER: Low risk tolerance. Sells quickly on any downward trend or negative signal.
    - DIAMOND_HANDS: Never sells unless the price is at a massive profit or the market is literally dead.
    - MARKET_MAKER: Provides liquidity by placing both buy and sell orders around the current price.
    
    YOUR GOAL:
    Analyze the provided market context and choose the single most effective tool call to advance your strategy.
    
    AVAILABLE TOOLS:
    ${JSON.stringify(tools, null, 2)}
    
    MARKET CONTEXT:
    ${JSON.stringify(context, null, 2)}
    
    INSTRUCTIONS:
    1. Think step-by-step about the market condition.
    2. Consider your reputation, capital balance, and the swarm consensus.
    3. Choose exactly ONE tool to call.
    4. Return a valid JSON object with the following fields:
       - "thought": A short explanation of your reasoning (max 100 characters).
       - "tool": The name of the tool to call.
       - "args": The arguments for the tool call.
       
    Example Output:
    {
      "thought": "Price is dip-testing support with bullish swarm consensus. Accumulating position.",
      "tool": "place_order",
      "args": {
        "type": "buy",
        "orderType": "limit",
        "amount": 10,
        "price": 0.95
      }
    }
    `;
    try {
        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: "Decide your next action." }] }],
            systemInstruction: { role: 'system', parts: [{ text: systemPrompt }] },
        });
        const responseText = (await result.response).candidates[0].content.parts[0].text;
        const action = JSON.parse(responseText);
        logger.info(`[AgentDecide] Style: ${style}, Tool: ${action.tool}, Thought: ${action.thought}`);
        return action;
    }
    catch (e) {
        logger.error("[AgentDecide] Error", e);
        throw new HttpsError('internal', "Failed to generate agent action: " + e.message);
    }
};
export const handleTickAgents = async (request) => {
    const { derivativeId } = request.data;
    if (!derivativeId)
        throw new HttpsError('invalid-argument', 'Missing derivativeId');
    try {
        const { agentService } = await import('../services/agents.js');
        await agentService.tickAgents(derivativeId);
        return { success: true };
    }
    catch (error) {
        logger.error(`[Agent] Swarm tick failed for ${derivativeId}`, error);
        throw new HttpsError('internal', error.message);
    }
};
export const handleSaveMemory = async (request) => {
    const { agentId, memory } = request.data;
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be logged in.');
    }
    try {
        const { agentService } = await import('../services/agents.js');
        await agentService.saveMemory(request.auth.uid, agentId, memory);
        return { success: true };
    }
    catch (error) {
        logger.error(`[Agent] Save memory failed`, error);
        throw new HttpsError('internal', error.message);
    }
};
export const handleGetMemory = async (request) => {
    const { agentId } = request.data;
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be logged in.');
    }
    try {
        const { agentService } = await import('../services/agents.js');
        const memory = await agentService.getMemory(request.auth.uid, agentId);
        return { memory };
    }
    catch (error) {
        logger.error(`[Agent] Get memory failed`, error);
        throw new HttpsError('internal', error.message);
    }
};
//# sourceMappingURL=agents.js.map