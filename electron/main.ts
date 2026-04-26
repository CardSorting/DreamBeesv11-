import { app, BrowserWindow, ipcMain, WebContents, session } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { GenerationRecord, LiteDatabase } from './database';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Shim for dependencies that rely on __filename/__dirname (like better-sqlite3's bindings).
Object.defineProperty(globalThis, '__filename', { value: __filename });
Object.defineProperty(globalThis, '__dirname', { value: __dirname });

let mainWindow: BrowserWindow | null = null;
let db: LiteDatabase | null = null;
let dbInitError: string | null = null;

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

  // 1. Outgoing: Spoof Origin/Referer to appear as the authorized domain
  session.defaultSession.webRequest.onBeforeSendHeaders({
    urls: [
      'https://*.googleapis.com/*',
      'https://*.firebaseio.com/*',
      'https://*.firebaseapp.com/*',
      'https://accounts.google.com/*'
    ]
  }, (details, callback) => {
    details.requestHeaders['Origin'] = `https://${authDomain}`;
    details.requestHeaders['Referer'] = `https://${authDomain}/`;
    callback({ cancel: false, requestHeaders: details.requestHeaders });
  });

  // 2. Incoming: Force Allow CORS to bypass renderer-side origin checks
  session.defaultSession.webRequest.onHeadersReceived({
    urls: [
      'https://*.googleapis.com/*',
      'https://*.firebaseio.com/*',
      'https://*.firebaseapp.com/*',
      'https://accounts.google.com/*'
    ]
  }, (details, callback) => {
    const responseHeaders = { ...details.responseHeaders };
    
    // Inject broad CORS headers to satisfy the browser's security model
    responseHeaders['Access-Control-Allow-Origin'] = ['*'];
    responseHeaders['Access-Control-Allow-Methods'] = ['GET, POST, OPTIONS, PUT, DELETE'];
    responseHeaders['Access-Control-Allow-Headers'] = ['*'];
    
    // Implement CSP
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
      sandbox: true,
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
