export interface ElectronAPI {
  lite: {
    health: () => Promise<{ ok: boolean; appVersion: string; dbAvailable: boolean; dbError: string | null; packaged: boolean }>;
    saveGeneration: (data: any) => Promise<any>;
    getGenerations: (limit: number) => Promise<any[]>;
    setSetting: (key: string, val: any) => Promise<void>;
    getSetting: (key: string) => Promise<any>;
  };
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
