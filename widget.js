const { BrowserWindow, ipcMain } = require('electron');
const path = require('path');

const COMPACT = { width: 300, height: 180 };
const FULL    = { width: 350, height: 500 };

function createWidgetWindow() {
  const { screen } = require('electron');
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  const widgetWindow = new BrowserWindow({
    width:  COMPACT.width,
    height: COMPACT.height,
    x: width  - COMPACT.width  - 20,
    y: height - COMPACT.height - 20,
    frame: false,
    alwaysOnTop: true,
    resizable: true,
    minWidth: 300,
    minHeight: 180,
    transparent: true,
    backgroundColor: '#00000000',
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

  // IPC: toggle compact <-> full
  ipcMain.on('widget-set-mode', (event, mode) => {
    // Don't force resize on mode switch; let user maintain their chosen size
    // This allows flexible resizing independent of mode changes
  });

  // IPC: close / minimize
  ipcMain.on('widget-close',    () => widgetWindow.hide());
  ipcMain.on('widget-minimize', () => widgetWindow.minimize());

  widgetWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file://')) event.preventDefault();
  });

  return widgetWindow;
}

module.exports = { createWidgetWindow };
