const { BrowserWindow, ipcMain } = require('electron');
const path = require('path');

function createWidgetWindow() {
  const { screen } = require('electron');
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  const widgetWindow = new BrowserWindow({
    width: 360,
    height: 500,
    x: width - 360 - 20,
    y: height - 500 - 20,
    frame: false,
    alwaysOnTop: true,
    resizable: true,
    minWidth: 320,
    minHeight: 450,
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

  ipcMain.on('widget-close', () => widgetWindow.hide());

  widgetWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file://')) event.preventDefault();
  });

  return widgetWindow;
}

module.exports = { createWidgetWindow };
