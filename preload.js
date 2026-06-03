const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  closeWidget: () => ipcRenderer.invoke('close-widget'),
  showMainWindow: () => ipcRenderer.invoke('show-main-window'),
  notify: (title, body) => ipcRenderer.invoke('show-notification', { title, body }),
  openWidget: () => ipcRenderer.invoke('open-widget'),
});
