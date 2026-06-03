const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // IPC send (renderer → main)
  ipcSend: (channel, data) => {
    ipcRenderer.send(channel, data);
  },
  
  // IPC on (renderer listens for main)
  onIPC: (channel, callback) => {
    ipcRenderer.on(channel, (event, data) => callback(data));
  },
  
  // Widget-specific APIs
  closeWidget: () => ipcRenderer.invoke('close-widget'),
  showMainWindow: () => ipcRenderer.invoke('show-main-window'),
  notify: (title, body) => ipcRenderer.invoke('show-notification', { title, body }),
  openWidget: () => ipcRenderer.invoke('open-widget'),
});
