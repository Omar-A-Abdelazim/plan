const { BrowserWindow, ipcMain } = require('electron');
const path = require('path');

function createWidgetWindow() {
  const { screen } = require('electron');
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  // Load persisted window state or use defaults
  let windowState = {
    x: width - 360 - 20,
    y: height - 500 - 20,
    width: 360,
    height: 500,
  };

  try {
    const fs = require('fs');
    const stateFile = path.join(__dirname, '.widget-state.json');
    if (fs.existsSync(stateFile)) {
      const saved = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
      windowState = { ...windowState, ...saved };
    }
  } catch (e) {
    // Silently fail, use defaults
  }

  const widgetWindow = new BrowserWindow({
    width: windowState.width,
    height: windowState.height,
    x: windowState.x,
    y: windowState.y,
    frame: false,
    alwaysOnTop: true,
    resizable: true,
    minWidth: 320,
    minHeight: 300,
    maxWidth: 500,
    maxHeight: 700,
    transparent: false,
    backgroundColor: '#1f1f2e',
    show: false,
    hasShadow: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      sandbox: true,
    },
  });

  widgetWindow.loadURL(`file://${path.join(__dirname, 'widget.html')}`);

  widgetWindow.webContents.on('did-finish-load', () => {
    widgetWindow.show();
    widgetWindow.focus();
  });

  // IPC: Handle timer state updates from main app
  ipcMain.on('pomodoro-state-update', (event, state) => {
    widgetWindow.webContents.send('pomodoro-state-changed', state);
  });

  // IPC: Handle timer control from widget
  ipcMain.on('widget-timer-control', (event, action) => {
    // Relay to main window
    const mainWindow = require('electron').app.windows?.main;
    if (mainWindow) {
      mainWindow.webContents.send('widget-timer-action', action);
    }
  });

  // IPC: Close widget
  ipcMain.on('widget-close', () => widgetWindow.hide());

  // Save window state on move/resize (throttled)
  let saveTimeout;
  const saveWindowState = () => {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      try {
        const fs = require('fs');
        const bounds = widgetWindow.getBounds();
        const state = {
          x: bounds.x,
          y: bounds.y,
          width: bounds.width,
          height: bounds.height,
        };
        const stateFile = path.join(__dirname, '.widget-state.json');
        fs.writeFileSync(stateFile, JSON.stringify(state), 'utf8');
      } catch (e) {
        // Silently fail
      }
    }, 500);
  };

  widgetWindow.on('move', saveWindowState);
  widgetWindow.on('resize', saveWindowState);

  widgetWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file://')) event.preventDefault();
  });

  return widgetWindow;
}

module.exports = { createWidgetWindow };
