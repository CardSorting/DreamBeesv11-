import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  lite: {
    health: () => ipcRenderer.invoke('lite:health'),
    saveGeneration: (data: any) => ipcRenderer.invoke('lite:saveGeneration', data),
    getGenerations: (limit: number) => ipcRenderer.invoke('lite:getGenerations', limit),
    setSetting: (key: string, val: any) => ipcRenderer.invoke('lite:setSetting', key, val),
    getSetting: (key: string) => ipcRenderer.invoke('lite:getSetting', key),
    googleLogin: () => ipcRenderer.invoke('auth:google-login'),
    getPendingLink: () => ipcRenderer.invoke('auth:get-pending-link'),
    onDeepLink: (callback: (url: string) => void) => {
      const subscription = (_event: any, url: string) => callback(url);
      ipcRenderer.on('auth:deep-link', subscription);
      return () => {
        ipcRenderer.removeListener('auth:deep-link', subscription);
      };
    }
  }
});
