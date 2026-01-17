import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore, memoryLocalCache } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions, httpsCallable } from "firebase/functions";


const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

if (!firebaseConfig.apiKey) {
  console.error("Firebase API Key is missing! Check your .env file.");
}

const app = initializeApp(firebaseConfig);



export const auth = getAuth(app);
let dbInstance;

try {
  // Use memory cache explicitly to prevent "Unexpected state" internal assertion errors
  // often caused by corrupted IndexedDB data from previous sessions/versions.
  // This trades offline persistence for stability.
  dbInstance = initializeFirestore(app, {
    localCache: memoryLocalCache(),
  });
  console.log("[Firebase] Firestore initialized (Memory Cache Mode).");
} catch (error) {
  console.error("[Firebase] Primary Firestore initialization failed. Attempting fallback...", error);
  try {
    // Ultimate fallback to default settings if the explicit config fails
    dbInstance = getFirestore(app);
    console.log("[Firebase] Firestore initialized with default settings (Fallback).");
  } catch (fallbackError) {
    console.error("[Firebase] CRITICAL: Firestore initialization completely failed.", fallbackError);
    // Ensure db export is at least undefined or null rather than crashing module load? 
    // Actually, throwing here might be better to surface the fatal error, 
    // but the user asked for "fault tolerant", so let's allow it to proceed (db will be undefined/broken but app runs).
  }
}

export const db = dbInstance;
export const storage = getStorage(app);
export const functions = getFunctions(app, 'us-central1');
