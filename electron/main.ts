import { app, BrowserWindow, ipcMain, WebContents, session, shell } from 'electron';
import http from 'http';
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
  console.log(`[main] ${message}${suffix}`);
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
    return new Promise((resolve, reject) => {
      const port = 3000; // Use port 3000 as it is most likely to be whitelisted in Firebase
      
      const server = http.createServer((req, res) => {
        const url = new URL(req.url || '', `http://localhost:${port}`);
        
        if (url.pathname === '/callback') {
          const idToken = url.searchParams.get('id_token');
          const accessToken = url.searchParams.get('access_token');
          
          if (idToken) {
            resolve(`dreambees://auth?id_token=${idToken}&access_token=${accessToken || ''}`);
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end('<h1>Success!</h1><p>Identity manifested. You can close this window now.</p><script>window.close();</script>');
            server.close();
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
  <title>DreamBees Auth Bridge</title>
  <style>
    body { font-family: sans-serif; background: #09090b; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .btn { background: white; color: black; border: none; padding: 12px 24px; border-radius: 12px; font-weight: bold; cursor: pointer; text-decoration: none; display: inline-block; }
    .loader { border: 3px solid #1a1a1c; border-top: 3px solid #8b5cf6; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin-bottom: 20px; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div style="text-align: center;">
    <div id="status">
      <div class="loader" style="margin: 0 auto 20px;"></div>
      <p id="msg">Stabilizing Identity Portal...</p>
    </div>
    <div id="action" style="display: none;">
       <button class="btn" onclick="login()">Connect Identity</button>
    </div>
  </div>

  <script type="module">
    import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
    import { getAuth, signInWithRedirect, getRedirectResult, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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

    async function checkResult() {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          const credential = GoogleAuthProvider.credentialFromResult(result);
          const idToken = await result.user.getIdToken();
          const accessToken = credential.accessToken;
          
          document.getElementById('msg').innerText = "Identity Manifested. Returning...";
          window.location.href = "/callback?id_token=" + encodeURIComponent(idToken) + "&access_token=" + encodeURIComponent(accessToken || '');
        } else {
          document.getElementById('status').style.display = 'none';
          document.getElementById('action').style.display = 'block';
        }
      } catch (err) {
        console.error(err);
        document.getElementById('msg').innerHTML = "<span style='color: #ef4444'>The vision was interrupted: " + err.message + "</span>";
        document.getElementById('action').style.display = 'block';
      }
    }

    window.login = () => {
      document.getElementById('action').style.display = 'none';
      document.getElementById('status').style.display = 'block';
      document.getElementById('msg').innerText = "Redirecting to Google...";
      signInWithRedirect(auth, provider);
    };

    checkResult();
  </script>
</body>
</html>
        `);
      });

      server.listen(port, '127.0.0.1', () => {
        logStartup(`Auth bridge listening on http://127.0.0.1:${port}`);
        shell.openExternal(`http://127.0.0.1:${port}`);
      });

      server.on('error', (err) => {
        logStartup('Auth bridge server error', err);
        reject(err);
      });

      // Safety timeout
      setTimeout(() => {
        server.close();
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
