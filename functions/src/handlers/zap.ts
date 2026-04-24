import { HttpsError } from "firebase-functions/v2/https";
import { RequestWithAuth } from "../types/functions.js";
import { zapService } from "../services/zap.js";
import { logger } from "../lib/utils.js";
import { db } from "../firebaseInit.js";
import { request } from "http";


export const handleCreateDerivative = async (request: RequestWithAuth<any>) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be logged in.');
    }

    try {
        const derivative = await zapService.createDerivative(request.data);
        logger.info(`[Zap] Derivative created: ${derivative.id}`);
        return derivative;
    } catch (error: any) {
        logger.error(`[Zap] Create derivative failed`, error);
        throw new HttpsError('internal', error.message);
    }
};

export const handleExecuteTrade = async (request: RequestWithAuth<any>) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be logged in.');
    }

    try {
        const tradeData = {
            ...request.data,
            buyerId: request.auth.uid
        };
        const result = await zapService.executeTrade(tradeData);
        logger.info(`[Zap] Trade executed: ${result.id}`);
        return result;
    } catch (error: any) {
        logger.error(`[Zap] Execute trade failed`, error);
        throw new HttpsError('internal', error.message);
    }
};

export const handleGetDerivatives = async (request: RequestWithAuth<any>) => {
    try {
        const limit = request.data.limit || 20;
        const snapshot = await db.collection('zap_derivatives')
            .orderBy('createdAt', 'desc')
            .limit(limit)
            .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error: any) {
        logger.error(`[Zap] Get derivatives failed`, error);
        throw new HttpsError('internal', error.message);
    }
};

export const handleGetDerivativeById = async (request: RequestWithAuth<any>) => {
    try {
        const { id } = request.data;
        if (!id) throw new Error("Missing ID");
        const doc = await db.collection('zap_derivatives').doc(id).get();
        if (!doc.exists) return null;
        return { id: doc.id, ...doc.data() };
    } catch (error: any) {
        logger.error(`[Zap] Get derivative by ID failed`, error);
        throw new HttpsError('internal', error.message);
    }
};

