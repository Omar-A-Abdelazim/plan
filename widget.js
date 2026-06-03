const { BrowserWindow, ipcMain } = require('electron');
const path = require('path');

function createWidgetWindow() {
  const { screen } = require('electron');
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  const widgetWindow = new BrowserWindow({
    width: 800,
    height: 600,
    x: width - 820,
    y: height - 620,
    frame: false,
    alwaysOnTop: true,
    resizable: true,
    minWidth: 500,
    minHeight: 300,
    transparent: false,
    backgroundColor: '#0f0f1a',
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

  // IPC: Add task
  ipcMain.on('widget-add-task', (event, taskText) => {
    widgetWindow.webContents.send('task-added', taskText);
  });

  // IPC: Toggle task
  ipcMain.on('widget-toggle-task', (event, taskId) => {
    widgetWindow.webContents.send('task-toggled', taskId);
  });

  // IPC: Delete task
  ipcMain.on('widget-delete-task', (event, taskId) => {
    widgetWindow.webContents.send('task-deleted', taskId);
  });

  // IPC: Close widget
  ipcMain.on('widget-close', () => widgetWindow.hide());

  widgetWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file://')) event.preventDefault();
  });

  return widgetWindow;
}

module.exports = { createWidgetWindow };
