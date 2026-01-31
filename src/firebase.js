import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore, memoryLocalCache } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";


const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let app;
let auth;
let dbInstance;
let storage;
let functions;

try {
  if (!firebaseConfig.apiKey) {
    throw new Error("Missing Firebase API Key. Check .env configuration.");
  }

  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  storage = getStorage(app);
  functions = getFunctions(app, 'us-central1');

  try {
    // Use memory cache explicitly to prevent "Unexpected state" internal assertion errors
    dbInstance = initializeFirestore(app, {
      localCache: memoryLocalCache(),
    });
    console.warn("[Firebase] Firestore initialized (Memory Cache Mode).");
  } catch (firestoreError) {
    console.warn("[Firebase] Primary Firestore initialization failed. Attempting fallback...", firestoreError);
    try {
      dbInstance = getFirestore(app);
      console.warn("[Firebase] Firestore initialized with default settings (Fallback).");
    } catch (fallbackError) {
      console.error("[Firebase] CRITICAL: Firestore initialization completely failed.", fallbackError);
      // dbInstance remains undefined
    }
  }

} catch (error) {
  console.error("[Firebase] CRITICAL: Firebase app initialization failed.", error);
  // Create mock objects or leave as undefined to allow app to render error boundary
}

export { auth, storage, functions };
export const db = dbInstance;
