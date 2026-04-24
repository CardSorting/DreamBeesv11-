import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { LiteDatabase } from './database';

let mainWindow: BrowserWindow | null = null;
let db: LiteDatabase | null = null;

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
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#000000',
    show: false
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  db = new LiteDatabase();
  
  // Hardened LITE IPC Handlers
  ipcMain.handle('lite:saveGeneration', (_, data) => db!.saveGeneration(data));
  ipcMain.handle('lite:getGenerations', (_, limit) => db!.getGenerations(limit));
  ipcMain.handle('lite:setSetting', (_, key, val) => db!.setSetting(key, val));
  ipcMain.handle('lite:getSetting', (_, key) => db!.getSetting(key));

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Security: Disable navigation
app.on('web-contents-created', (_, contents) => {
  contents.on('will-navigate', (event) => {
    event.preventDefault();
  });
  contents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });
});
