import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions, httpsCallable } from "firebase/functions";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);

// Initialize App Check with Cloudflare Turnstile
if (typeof window !== "undefined") {
  // Enable debug token for local development (both dev and preview modes)
  if (import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    console.debug('Firebase App Check: Debug token enabled for localhost.');
  }

  const turnstileProvider = {
    getToken: async () => {
      return new Promise((resolve, reject) => {
        // Create a hidden container for Turnstile if it doesn't exist
        let container = document.getElementById('turnstile-container');
        if (!container) {
          container = document.createElement('div');
          container.id = 'turnstile-container';
          container.style.display = 'none';
          document.body.appendChild(container);
        }

        try {
          window.turnstile.render('#turnstile-container', {
            sitekey: import.meta.env.VITE_TURNSTILE_SITE_KEY,
            callback: async (token) => {
              try {
                const exchangeFn = httpsCallable(getFunctions(app), 'exchangeTurnstileToken');
                const result = await exchangeFn({ token });
                resolve({
                  token: result.data.token,
                  expireTimeMillis: result.data.expireTimeMillis
                });
              } catch (err) {
                console.error('App Check exchange failed:', err);
                reject(err);
              } finally {
                // Cleanup
                window.turnstile.remove();
              }
            },
            'error-callback': (err) => {
              console.error('Turnstile error:', err);
              reject(new Error('Turnstile widget failed to render.'));
            }
          });
        } catch (err) {
          console.error('Turnstile render failed:', err);
          reject(err);
        }
      });
    }
  };

  try {
    initializeAppCheck(app, {
      provider: turnstileProvider,
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
