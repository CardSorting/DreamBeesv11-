export interface ElectronAPI {
  lite: {
    saveGeneration: (data: any) => Promise<any>;
    getGenerations: (limit: number) => Promise<any[]>;
    setSetting: (key: string, val: any) => Promise<void>;
    getSetting: (key: string) => Promise<any>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
