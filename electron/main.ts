import { app, BrowserWindow, ipcMain, WebContents, session, shell, net } from 'electron';
import http from 'http';
import netModule from 'net'; // For port discovery
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GenerationRecord, LiteDatabase } from './database';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Shim for dependencies that rely on __filename/__dirname (like better-sqlite3's bindings).
Object.defineProperty(globalThis, '__filename', { value: __filename });
Object.defineProperty(globalThis, '__dirname', { value: __dirname });

dotenv.config();

if (!app.requestSingleInstanceLock()) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;
let db: LiteDatabase | null = null;
let dbInitError: string | null = null;
let pendingAuthResolve: ((url: string) => void) | null = null;
let activeAuthServer: http.Server | null = null;
let authServerTimeout: NodeJS.Timeout | null = null;

if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('dreambees', process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient('dreambees');
}

const isDev = !app.isPackaged;
const devServerUrl = process.env.VITE_DEV_SERVER_URL;
const rendererRoot = path.resolve(__dirname, '../dist');
const authDomain = 'dreambees-alchemist.firebaseapp.com';

function logStartup(message: string, error?: unknown) {
  const suffix = error instanceof Error ? `: ${error.stack || error.message}` : error ? `: ${String(error)}` : '';
  console.log(`[main] ${new Date().toISOString()} | ${message}${suffix}`);
}

async function findAvailablePort(startPort: number): Promise<number> {
  return new Promise((resolve) => {
    const server = netModule.createServer();
    server.unref();
    server.on('error', () => resolve(findAvailablePort(startPort + 1)));
    server.listen(startPort, '127.0.0.1', () => {
      const port = (server.address() as netModule.AddressInfo).port;
      server.close(() => resolve(port));
    });
  });
}

function cleanupAuthServer() {
  if (activeAuthServer) {
    activeAuthServer.close();
    activeAuthServer = null;
  }
  if (authServerTimeout) {
    clearTimeout(authServerTimeout);
    authServerTimeout = null;
  }
}

function ensureDb() {
  if (!db) throw new Error(dbInitError || 'Local database is unavailable');
  return db;
}

function registerIpcHandlers() {
  // Health check with system diagnostics
  ipcMain.handle('lite:health', async () => ({
    ok: true,
    appVersion: app.getVersion(),
    dbAvailable: Boolean(db),
    dbError: dbInitError,
    packaged: app.isPackaged,
    platform: process.platform,
    arch: process.arch,
  }));

  ipcMain.handle('lite:saveGeneration', async (_, data: GenerationRecord) => {
    try {
      if (!data?.id) throw new Error('Generation record must have an ID');
      return ensureDb().saveGeneration(data);
    } catch (error) {
      logStartup('Failed to save generation', error);
      throw error;
    }
  });

  ipcMain.handle('lite:getGenerations', async (_, limit?: number) => {
    try {
      return ensureDb().getGenerations(limit);
    } catch (error) {
      logStartup('Failed to get generations', error);
      return [];
    }
  });

  ipcMain.handle('lite:setSetting', async (_, key: string, val: unknown) => {
    try {
      return ensureDb().setSetting(key, val);
    } catch (error) {
      logStartup(`Failed to set setting: ${key}`, error);
      throw error;
    }
  });

  ipcMain.handle('lite:getSetting', async (_, key: string) => {
    try {
      return ensureDb().getSetting(key);
    } catch (error) {
      logStartup(`Failed to get setting: ${key}`, error);
      return null;
    }
  });

  // Local Self-Contained Google Auth Flow for Electron
  ipcMain.handle('auth:google-login', async () => {
    cleanupAuthServer(); // Kill any stale sessions
    
    return new Promise(async (resolve, reject) => {
      // Preference for port 3000 to maximize likelihood of being whitelisted in Firebase Console
      const preferredPort = 3000;
      const actualPort = await findAvailablePort(preferredPort);
      
      if (actualPort !== preferredPort) {
        logStartup(`Port ${preferredPort} occupied. Falling back to port ${actualPort}. Note: You may need to whitelist http://127.0.0.1:${actualPort} in Firebase Console.`);
      }
      
      const server = http.createServer((req, res) => {
        const url = new URL(req.url || '', `http://127.0.0.1:${actualPort}`);
        
        if (url.pathname === '/callback') {
          const idToken = url.searchParams.get('id_token');
          const accessToken = url.searchParams.get('access_token');
          
          if (idToken) {
            // Return structured data to the renderer instead of a raw URL
            resolve({ idToken, accessToken });
            
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`
              <body style="background: #09090b; color: white; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
                <div style="text-align: center; max-width: 400px; padding: 40px;">
                  <div style="font-size: 48px; margin-bottom: 20px;">🐝</div>
                  <h1 style="color: #8b5cf6; margin-bottom: 12px; font-weight: 600;">Success!</h1>
                  <p style="color: #a1a1aa; line-height: 1.5;">You've signed in successfully. We're taking you back to DreamBees now.</p>
                  <script>setTimeout(() => window.close(), 2000);</script>
                </div>
              </body>
            `);
            cleanupAuthServer();
          } else {
            res.writeHead(400);
            res.end('Authentication failed: Missing tokens.');
          }
          return;
        }

        // Serve the Auth Bridge Page
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
<!DOCTYPE html>
<html>
<head>
  <title>Sign in to DreamBees</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #09090b; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .loader { border: 3px solid #1a1a1c; border-top: 3px solid #8b5cf6; border-radius: 50%; width: 24px; height: 24px; animation: spin 1s linear infinite; margin: 0 auto 20px; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .container { text-align: center; max-width: 400px; padding: 40px; }
    h1 { font-size: 20px; font-weight: 600; margin-bottom: 8px; }
    p { color: #a1a1aa; font-size: 15px; margin-bottom: 24px; }
    .btn { background: #8b5cf6; color: white; border: none; padding: 12px 24px; border-radius: 12px; font-weight: 600; cursor: pointer; font-size: 15px; transition: background 0.2s; }
    .btn:hover { background: #7c3aed; }
  </style>
</head>
<body>
  <div class="container">
    <div id="status">
      <div style="font-size: 48px; margin-bottom: 20px;">🐝</div>
      <h1 id="msg">Ready to connect</h1>
      <p id="submsg">Click the button below to sign in securely with Google.</p>
      <div id="action">
        <button class="btn" onclick="startAuth()">Sign in with Google</button>
      </div>
    </div>
  </div>

  <script type="module">
    import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
    import { getAuth, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

    const config = {
      apiKey: "${process.env.VITE_FIREBASE_API_KEY}",
      authDomain: "${process.env.VITE_FIREBASE_AUTH_DOMAIN}",
      projectId: "${process.env.VITE_FIREBASE_PROJECT_ID}",
      storageBucket: "${process.env.VITE_FIREBASE_STORAGE_BUCKET}",
      messagingSenderId: "${process.env.VITE_FIREBASE_MESSAGING_SENDER_ID}",
      appId: "${process.env.VITE_FIREBASE_APP_ID}"
    };

    const app = initializeApp(config);
    const auth = getAuth(app);
    const provider = new GoogleAuthProvider();

    async function startAuth() {
      try {
        document.getElementById('action').style.display = 'none';
        document.getElementById('msg').innerText = "Connecting...";
        
        const result = await signInWithPopup(auth, provider);
        const idToken = await result.user.getIdToken();
        const accessToken = GoogleAuthProvider.credentialFromResult(result)?.accessToken;
        
        document.getElementById('status').innerHTML = \`
          <div class="loader"></div>
          <h1>Success!</h1>
          <p>Returning to DreamBees...</p>
        \`;
        
        window.location.href = "/callback?id_token=" + encodeURIComponent(idToken) + "&access_token=" + encodeURIComponent(accessToken || '');
      } catch (err) {
        console.error(err);
        document.getElementById('msg').innerText = "Sign-in interrupted";
        document.getElementById('submsg').innerHTML = "<span style='color: #ef4444'>" + err.message + "</span>";
        document.getElementById('action').style.display = 'block';
      }
    }

    window.startAuth = startAuth;
  </script>
</body>
</html>
        `);
      });

      activeAuthServer = server;
      server.listen(actualPort, '127.0.0.1', () => {
        logStartup(`Auth bridge listening on http://127.0.0.1:${actualPort}`);
        shell.openExternal(`http://127.0.0.1:${actualPort}`);
      });

      server.on('error', (err) => {
        logStartup('Auth bridge server error', err);
        cleanupAuthServer();
        reject(err);
      });

      authServerTimeout = setTimeout(() => {
        cleanupAuthServer();
        reject(new Error('Authentication timed out after 5 minutes.'));
      }, 300000);
    });
  });
}

function tryInitDatabase() {
  try {
    db = new LiteDatabase();
    dbInitError = null;
    logStartup('Local database initialized');
  } catch (error) {
    db = null;
    dbInitError = error instanceof Error ? error.message : String(error);
    logStartup('Local database unavailable; continuing without local persistence', error);
  }
}

function attachWebContentsDiagnostics(contents: WebContents) {
  contents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    logStartup(`Renderer did-fail-load ${errorCode} ${errorDescription} ${validatedURL}`);
  });
  contents.on('render-process-gone', (_event, details) => {
    logStartup(`Renderer process gone: ${details.reason} (${details.exitCode})`);
  });
  contents.on('unresponsive', () => logStartup('Renderer became unresponsive'));
}

function isAllowedNavigation(url: string) {
  if (devServerUrl && url.startsWith(devServerUrl)) return true;

  try {
    const parsed = new URL(url);
    
    // Allow Firebase and Google Auth domains
    const allowedHosts = [
      'accounts.google.com',
      authDomain,
      'firebaseapp.com'
    ];
    
    if (allowedHosts.some(host => parsed.hostname === host || parsed.hostname.endsWith('.' + host))) {
      return true;
    }

    if (parsed.protocol === 'file:') {
      const targetPath = path.resolve(fileURLToPath(parsed));
      return targetPath === rendererRoot || targetPath.startsWith(`${rendererRoot}${path.sep}`);
    }
    return parsed.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(parsed.hostname);
  } catch {
    return false;
  }
}

function setupSecurityHeaders() {
  const authDomain = 'dreambees-alchemist.firebaseapp.com';

  // 1. Outgoing: Comprehensive Masquerade
  session.defaultSession.webRequest.onBeforeSendHeaders({
    urls: [
      'https://*.googleapis.com/*',
      'https://*.firebaseio.com/*',
      'https://*.firebaseapp.com/*',
      'https://accounts.google.com/*'
    ]
  }, (details, callback) => {
    const headers = { ...details.requestHeaders };
    
    headers['Origin'] = `https://${authDomain}`;
    headers['Referer'] = `https://${authDomain}/`;
    
    // Mask metadata to appear as a same-site request from the authorized domain
    headers['Sec-Fetch-Site'] = 'same-site';
    headers['Sec-Fetch-Mode'] = 'cors';
    headers['Sec-Fetch-Dest'] = 'empty';
    
    callback({ cancel: false, requestHeaders: headers });
  });

  // 2. Incoming: Force Allow CORS & Inject CSP
  session.defaultSession.webRequest.onHeadersReceived({
    urls: [
      'https://*.googleapis.com/*',
      'https://*.firebaseio.com/*',
      'https://*.firebaseapp.com/*',
      'https://accounts.google.com/*'
    ]
  }, (details, callback) => {
    const responseHeaders = { ...details.responseHeaders };
    
    responseHeaders['Access-Control-Allow-Origin'] = ['*'];
    responseHeaders['Access-Control-Allow-Methods'] = ['GET, POST, OPTIONS, PUT, DELETE'];
    responseHeaders['Access-Control-Allow-Headers'] = ['*'];
    
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      `img-src 'self' data: https: blob:`,
      `connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://api.dreambeesai.com https://www.google-analytics.com https://${authDomain}`,
      "frame-src 'self' https://accounts.google.com",
      "object-src 'none'"
    ].join('; ');
    
    responseHeaders['Content-Security-Policy'] = [csp];

    callback({ cancel: false, responseHeaders });
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webgl: true,
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#060608',
    show: false,
  });

  attachWebContentsDiagnostics(mainWindow.webContents);

  const loadPromise = devServerUrl
    ? mainWindow.loadURL(devServerUrl)
    : mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));

  loadPromise.catch((error) => {
    logStartup('Failed to load renderer', error);
  });

  if (isDev || process.env.DREAMBEES_OPEN_DEVTOOLS === '1') {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  setupSecurityHeaders();
  registerIpcHandlers();
  createWindow();
  tryInitDatabase();

  app.on('open-url', (event, url) => {
    event.preventDefault();
    logStartup(`Received protocol URL: ${url}`);
    if (url.startsWith('dreambees://auth')) {
      if (pendingAuthResolve) {
        pendingAuthResolve(url);
        pendingAuthResolve = null;
      }
    }
  });

  // Windows/Linux handle deep link from argv
  app.on('second-instance', (_event, commandLine) => {
    const url = commandLine.pop();
    if (url?.startsWith('dreambees://auth')) {
      if (pendingAuthResolve) {
        pendingAuthResolve(url);
        pendingAuthResolve = null;
      }
    }
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
}).catch((error) => {
  logStartup('App failed during whenReady', error);
});

app.on('before-quit', () => {
  try {
    db?.close();
  } catch (error) {
    logStartup('Failed to close database', error);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Security: restrict navigation and new windows
app.on('web-contents-created', (_, contents) => {
  contents.on('will-navigate', (event, url) => {
    if (!isAllowedNavigation(url)) {
      logStartup(`Blocked unauthorized navigation to: ${url}`);
      event.preventDefault();
    }
  });

  contents.setWindowOpenHandler(({ url }) => {
    if (isAllowedNavigation(url)) {
      return { action: 'allow' };
    }
    logStartup(`Blocked unauthorized window opening: ${url}`);
    return { action: 'deny' };
  });

  // Harden: prevent rogue webviews
  contents.on('will-attach-webview', (event) => {
    event.preventDefault();
    logStartup('Blocked unauthorized webview attachment');
  });
});

process.on('uncaughtException', (error) => logStartup('Uncaught exception', error));
process.on('unhandledRejection', (reason) => logStartup('Unhandled rejection', reason));
