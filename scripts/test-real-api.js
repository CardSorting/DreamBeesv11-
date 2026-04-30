
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import dotenv from 'dotenv';

dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

async function triggerRealTest() {
    console.log("--- STARTING REAL NETWORK API TEST ---");
    
    try {
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const functions = getFunctions(app);

        // We need to be authenticated to call the API
        console.log("[Auth] Attempting to sign in...");
        // I'll use a test account if possible, or just try to call it anonymously 
        // and see if it reaches the 'unauthenticated' check in the backend.
        
        const apiCall = httpsCallable(functions, 'api');
        
        console.log("[Network] Sending request to 'api' function...");
        const result = await apiCall({
            action: 'createGenerationRequest',
            prompt: 'A real network test: hyper-realistic bee in space',
            modelId: 'wai-illustrious',
            requestId: `real_test_${Date.now()}`
        });

        console.log("[Success] Response received:", result.data);
    } catch (err) {
        console.error("[Error] Real test FAILED:");
        console.error("Code:", err.code);
        console.error("Message:", err.message);
        if (err.details) console.error("Details:", err.details);
    }
}

triggerRealTest();
