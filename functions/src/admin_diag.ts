
import { onRequest } from "firebase-functions/v2/https";
import { db } from "./firebaseInit.js";
import { logger } from "./lib/utils.js";

/**
 * ADMIN DIAGNOSTIC API (Unauthenticated)
 * WARNING: This is for development/testing only. 
 * Provides direct access to backend systems without Firebase Auth.
 */
export const admin_diag = onRequest({
    memory: "512MiB",
    cors: true,
    timeoutSeconds: 300
}, async (req, res) => {
    const { action } = req.body || req.query;

    logger.info(`[ADMIN_DIAG] Unauthenticated access: action=${action}`);

    try {
        switch (action) {
            case 'ping':
                res.json({ status: 'ok', timestamp: new Date().toISOString(), message: 'Pong!' });
                return;

            case 'check_db':
                const snap = await db.collection('users').limit(1).get();
                res.json({ 
                    status: 'ok', 
                    database: 'connected', 
                    userCountSample: snap.size 
                });
                return;

            case 'test_generation_logic':
                // Import handler directly to test logic without auth wrapper
                const { handleCreateGenerationRequest } = await import("./handlers/generation.js");
                
                // Pick a real user from the DB to ensure business logic passes (quota/cost checks)
                const userSnap = await db.collection('users').limit(1).get();
                const realUid = userSnap.docs[0]?.id || 'admin-test-uid';

                // Mock an authenticated request for the handler
                const mockRequest: any = {
                    auth: {
                        uid: realUid,
                        token: { role: 'admin' }
                    },
                    data: req.body.data || req.body // Handle both formats
                };

                const result = await handleCreateGenerationRequest(mockRequest);
                res.json({ 
                    status: 'ok', 
                    message: 'Generation logic executed successfully',
                    result 
                });
                return;

            default:
                res.status(400).json({ 
                    error: 'Unknown action', 
                    availableActions: ['ping', 'check_db', 'test_generation_logic'] 
                });
                return;
        }
    } catch (error: any) {
        logger.error("[ADMIN_DIAG_ERROR]", error);
        res.status(500).json({ 
            error: error.message, 
            stack: process.env.FUNCTIONS_EMULATOR ? error.stack : undefined 
        });
    }
});
