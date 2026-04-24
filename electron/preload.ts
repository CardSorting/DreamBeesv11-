import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  lite: {
    saveGeneration: (data: any) => ipcRenderer.invoke('lite:saveGeneration', data),
    getGenerations: (limit: number) => ipcRenderer.invoke('lite:getGenerations', limit),
    setSetting: (key: string, val: any) => ipcRenderer.invoke('lite:setSetting', key, val),
    getSetting: (key: string) => ipcRenderer.invoke('lite:getSetting', key),
  }
});
