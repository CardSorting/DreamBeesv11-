import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions, httpsCallable } from "firebase/functions";
import { initializeAppCheck, CustomProvider } from "firebase/app-check";

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

  const turnstileProvider = new CustomProvider({
    getToken: async () => {
      // Create a hidden container for Turnstile if it doesn't exist
      // Use visibility: hidden instead of display: none to avoid rendering issues
      let container = document.getElementById('turnstile-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'turnstile-container';
        container.style.visibility = 'hidden';
        container.style.position = 'absolute';
        container.style.top = '-9999px';
        container.style.left = '-9999px';
        document.body.appendChild(container);
      }

      const ensureTurnstileLoaded = () => {
        return new Promise((resolve, reject) => {
          if (window.turnstile) return resolve();

          // Check if script is already present
          let script = document.querySelector('script[src^="https://challenges.cloudflare.com/turnstile/v0/api.js"]');
          if (!script) {
            script = document.createElement('script');
            script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
          }

          const start = Date.now();
          const interval = setInterval(() => {
            if (window.turnstile) {
              clearInterval(interval);
              resolve();
            } else if (Date.now() - start > 15000) { // 15s timeout
              clearInterval(interval);
              reject(new Error("Turnstile script load timed out"));
            }
          }, 100);
        });
      };

      try {
        await ensureTurnstileLoaded();

        return new Promise((resolve, reject) => {
          try {
            const widgetId = window.turnstile.render('#turnstile-container', {
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
                  try { window.turnstile.remove(widgetId); } catch (e) { }
                }
              },
              'error-callback': (err) => {
                console.error('Turnstile widget error:', err);
                // Retry capability could be added here, but rejecting propagates to App Check retry
                reject(new Error('Turnstile widget failed to render.'));
              }
            });
          } catch (renderErr) {
            reject(renderErr);
          }
        });
      } catch (err) {
        console.error('Turnstile preparation failed:', err);
        throw err;
      }
    }
  });

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
let dbInstance;

try {
  dbInstance = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    }),
  });
  console.log("Firestore initialized with persistence (Auto-detect transport).");
} catch (error) {
  console.error("Firestore persistence failed (likely private mode). Falling back to memory cache.", error);
  // Fallback to default (memory) if persistence fails
  dbInstance = getFirestore(app);
}

export const db = dbInstance;
export const storage = getStorage(app);
export const functions = getFunctions(app);
