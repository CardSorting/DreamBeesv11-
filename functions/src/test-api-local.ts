
import { handleCreateGenerationRequest } from './handlers/generation.js';
import { db } from './firebaseInit.js';

async function runDiagnostic() {
    console.log("--- STARTING BACKEND DIAGNOSTIC ---");
    
    // Mock request object
    const mockRequest: any = {
        auth: {
            uid: 'test-user-id',
            token: { role: 'user' }
        },
        data: {
            action: 'createGenerationRequest',
            prompt: 'A hyper-realistic golden robotic bee with translucent wings, glowing blue circuitry, flying over a field of bioluminescent lavender at twilight, 8k resolution, cinematic lighting',
            modelId: 'wai-illustrious',
            requestId: `diag_${Date.now()}`
        }
    };

    try {
        console.log(`[Diagnostic] Testing handleCreateGenerationRequest for UID: ${mockRequest.auth.uid}`);
        const result = await handleCreateGenerationRequest(mockRequest);
        console.log("[Diagnostic] SUCCESS! Result:", result);
    } catch (err: any) {
        console.error("[Diagnostic] FAILED:", err.message);
        if (err.details) console.error("[Diagnostic] Details:", err.details);
    }
}

// Only run if this script is executed directly
if (import.meta.url.endsWith('test-api-local.ts')) {
    runDiagnostic().then(() => process.exit(0)).catch(e => {
        console.error(e);
        process.exit(1);
    });
}
