const { app, BrowserWindow, Menu, Tray, ipcMain, Notification, globalShortcut } = require('electron');
const isDev = require('electron-is-dev');
const path = require('path');

let mainWindow;
let tray;
let widgetWindow;
const isDevelopment = process.env.NODE_ENV === 'development' || isDev;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      sandbox: true,
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
  });

  const startUrl = isDevelopment
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../out/index.html')}`;

  mainWindow.loadURL(startUrl);

  if (isDevelopment) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('close', (event) => {
    event.preventDefault();
    mainWindow.hide();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createWidgetWindow() {
  if (widgetWindow && !widgetWindow.isDestroyed()) {
    widgetWindow.show();
    widgetWindow.focus();
    return widgetWindow;
  }

  widgetWindow = new BrowserWindow({
    width: 320,
    height: 600,
    minWidth: 280,
    minHeight: 400,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      sandbox: true,
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    frame: false,
    transparent: true,
    alwaysOnTop: true,
  });

  const widgetUrl = isDevelopment
    ? 'file://' + path.join(__dirname, 'widget.html')
    : `file://${path.join(__dirname, '../widget.html')}`;

  widgetWindow.loadFile(path.join(__dirname, 'widget.html'));

  widgetWindow.on('closed', () => {
    widgetWindow = null;
  });

  return widgetWindow;
}

function createTray() {
  tray = new Tray(path.join(__dirname, 'assets', 'icon.png'));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show / Hide',
      click: () => {
        if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    {
      label: 'Open Pomodoro Widget',
      click: () => {
        createWidgetWindow();
      },
    },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

app.on('ready', () => {
  createMainWindow();
  createTray();

  // Register global shortcut: Ctrl+Shift+P to toggle Pomodoro widget
  globalShortcut.register('ctrl+shift+p', () => {
    if (!widgetWindow || widgetWindow.isDestroyed()) {
      createWidgetWindow();
    } else if (widgetWindow.isVisible()) {
      widgetWindow.hide();
    } else {
      widgetWindow.show();
      widgetWindow.focus();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Don't quit on Windows/Linux; keep in tray
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createMainWindow();
  } else {
    mainWindow.show();
    mainWindow.focus();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// IPC handlers
ipcMain.handle('open-widget', () => {
  createWidgetWindow();
});

ipcMain.handle('show-notification', (event, { title, body }) => {
  new Notification({
    title: title || 'PlanFlow',
    body: body || '',
    icon: path.join(__dirname, 'assets', 'icon.png'),
  }).show();
});

ipcMain.handle('close-widget', () => {
  if (widgetWindow && !widgetWindow.isDestroyed()) {
    widgetWindow.hide();
  }
});

ipcMain.handle('show-main-window', () => {
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  }
});

// Widget state sync IPC handlers
ipcMain.on('update-widget-state', (event, state) => {
  if (widgetWindow && !widgetWindow.isDestroyed()) {
    widgetWindow.webContents.send('widget-state-update', state);
  }
});

ipcMain.on('widget-action', (event, action) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('widget-action', action);
  }
});
