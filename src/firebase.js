import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";

const firebaseConfig = {
  apiKey: "AIzaSyBJYV1qjNDx2hhwhArFVrmhQMj1yrHGhAU",
  authDomain: "dreambees-app-gen-v1.firebaseapp.com",
  projectId: "dreambees-app-gen-v1",
  storageBucket: "dreambees-app-gen-v1.firebasestorage.app",
  messagingSenderId: "53340933724",
  appId: "1:53340933724:web:9589b52fee96c9dafce099"
};

const app = initializeApp(firebaseConfig);

// Initialize App Check
// TODO: Replace "YOUR_RECAPTCHA_ENTERPRISE_SITE_KEY" with your actual key from Firebase Console
if (typeof window !== "undefined") {
  // Enable debug token for local development (both dev and preview modes)
  if (import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    console.debug('Firebase App Check: Debug token enabled for localhost');
  }

  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider("6LfV7z4sAAAAABQiwI8KMolvCaBoc1mkUvDXqkq5"),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (error) {
    console.error("Error initializing App Check:", error);
  }
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
