import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
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
  if (import.meta.env.DEV) {
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }
  initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider("6LfV7z4sAAAAABQiwI8KMolvCaBoc1mkUvDXqkq5"),
    isTokenAutoRefreshEnabled: true,
  });
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
