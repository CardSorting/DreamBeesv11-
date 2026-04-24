import { app, BrowserWindow, ipcMain, WebContents } from 'electron';
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

function logStartup(message: string, error?: unknown) {
  const suffix = error instanceof Error ? `: ${error.stack || error.message}` : error ? `: ${String(error)}` : '';
  console.log(`[main] ${message}${suffix}`);
}

function ensureDb() {
  if (!db) throw new Error(dbInitError || 'Local database is unavailable');
  return db;
}

function registerIpcHandlers() {
  ipcMain.handle('lite:health', async () => ({
    ok: true,
    appVersion: app.getVersion(),
    dbAvailable: Boolean(db),
    dbError: dbInitError,
    packaged: app.isPackaged,
  }));
  ipcMain.handle('lite:saveGeneration', async (_, data: GenerationRecord) => ensureDb().saveGeneration(data));
  ipcMain.handle('lite:getGenerations', async (_, limit?: number) => ensureDb().getGenerations(limit));
  ipcMain.handle('lite:setSetting', async (_, key: string, val: unknown) => ensureDb().setSetting(key, val));
  ipcMain.handle('lite:getSetting', async (_, key: string) => ensureDb().getSetting(key));
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
  contents.on('responsive', () => logStartup('Renderer became responsive'));
}

function isAllowedNavigation(url: string) {
  if (devServerUrl && url.startsWith(devServerUrl)) return true;

  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'file:') {
      const targetPath = path.resolve(fileURLToPath(parsed));
      return targetPath === rendererRoot || targetPath.startsWith(`${rendererRoot}${path.sep}`);
    }
    return parsed.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(parsed.hostname);
  } catch {
    return false;
  }
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
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#000000',
    show: false,
  });

  attachWebContentsDiagnostics(mainWindow.webContents);

  const loadPromise = devServerUrl
    ? mainWindow.loadURL(devServerUrl)
    : mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));

  loadPromise.catch((error) => {
    logStartup('Failed to load renderer', error);
    mainWindow?.show();
  });

  if (isDev || process.env.DREAMBEES_OPEN_DEVTOOLS === '1') {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  const showFallback = setTimeout(() => {
    if (mainWindow && !mainWindow.isVisible()) {
      logStartup('Showing window via ready-to-show fallback');
      mainWindow.show();
    }
  }, 5000);

  mainWindow.once('ready-to-show', () => {
    clearTimeout(showFallback);
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    clearTimeout(showFallback);
    mainWindow = null;
  });
}

app.whenReady().then(() => {
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

process.on('uncaughtException', (error) => logStartup('Uncaught exception', error));
process.on('unhandledRejection', (reason) => logStartup('Unhandled rejection', reason));

// Security: restrict navigation and new windows to known app/dev origins.
app.on('web-contents-created', (_, contents) => {
  contents.on('will-navigate', (event, url) => {
    if (!isAllowedNavigation(url)) event.preventDefault();
  });

  contents.setWindowOpenHandler(({ url }) => {
    return isAllowedNavigation(url) ? { action: 'allow' } : { action: 'deny' };
  });
});
