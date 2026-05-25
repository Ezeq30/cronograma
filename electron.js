const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const isDev = process.env.NODE_ENV === 'development';

let mainWindow;

function getAppPath() {
  if (isDev) return __dirname;
  return app.getAppPath();
}

function getDataPath() {
  if (isDev) return __dirname;
  if (process.env.PORTABLE_EXECUTABLE_DIR) return process.env.PORTABLE_EXECUTABLE_DIR;
  return path.dirname(process.execPath);
}

const DATA_FILE = () => path.join(getDataPath(), 'datos.json');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    autoHideMenuBar: true
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(getAppPath(), 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

ipcMain.handle('load-data', async () => {
  const file = DATA_FILE();
  if (!fs.existsSync(file)) return { cronograma: {}, ausencias: [] };
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch {
    return { cronograma: {}, ausencias: [] };
  }
});

ipcMain.handle('save-data', async (_event, data) => {
  const dir = getDataPath();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(path.join(dir, 'datos.json'), JSON.stringify(data, null, 2), 'utf-8');
  return { success: true };
});

ipcMain.handle('get-debug-info', async () => ({
  isDev,
  dataDir: getDataPath(),
  dataFile: DATA_FILE(),
  execPath: process.execPath,
  portableDir: process.env.PORTABLE_EXECUTABLE_DIR || null,
  appPath: getAppPath(),
  dataFileExists: fs.existsSync(DATA_FILE())
}));

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
