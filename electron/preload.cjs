const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  selectFile: () => ipcRenderer.invoke('select-file'),
  compile: (args) => ipcRenderer.invoke('compile', args),
});
