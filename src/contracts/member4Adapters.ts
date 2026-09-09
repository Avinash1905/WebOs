/**
 * member4Adapters.ts
 * Member 1 -> Member 4 Backend & Cloud Persistence Adapter
 * 
 * Defines the synchronization boundary between the frontend UI stores
 * (Theme, Shortcuts, Taskbar, Desktop icon layouts, Window state) and
 * Member 4's backend database / cloud synchronization layer.
 */

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  email?: string;
  role: 'admin' | 'user' | 'guest';
}

export interface DesktopSyncPayload {
  version: number;
  updatedAt: number;
  theme: {
    activeThemeId: string;
    customTokens?: Record<string, string>;
    density?: 'compact' | 'comfortable' | 'spacious';
    activeWallpaperId?: string;
  };
  shortcuts: {
    customBindings: Record<string, string>;
    disabledShortcuts: string[];
  };
  taskbar: {
    position: 'bottom' | 'top' | 'left' | 'right';
    alignment: 'center' | 'left';
    autoHide: boolean;
    showBadges: boolean;
  };
  desktop: {
    iconPositions: Record<string, { x: number; y: number }>;
    gridSnap: boolean;
    iconSize: 'small' | 'medium' | 'large';
  };
}

export interface IMember4BackendContract {
  getCurrentUser(): Promise<UserProfile>;
  saveUserSettings(payload: DesktopSyncPayload): Promise<boolean>;
  loadUserSettings(): Promise<DesktopSyncPayload | null>;
  subscribeToSyncEvents(listener: (payload: DesktopSyncPayload) => void): () => void;
  uploadWallpaperAsset(file: Blob, name: string): Promise<string>;
}

export class Member4BackendBridge implements IMember4BackendContract {
  private static instance: Member4BackendBridge;
  private syncListeners: Set<(payload: DesktopSyncPayload) => void> = new Set();
  private storageKey = 'webos_cloud_synced_settings';

  private constructor() {}

  public static getInstance(): Member4BackendBridge {
    if (!Member4BackendBridge.instance) {
      Member4BackendBridge.instance = new Member4BackendBridge();
    }
    return Member4BackendBridge.instance;
  }

  private get externalBackend(): IMember4BackendContract | null {
    if (typeof window !== 'undefined' && (window as unknown as { __WEBOS_BACKEND__?: IMember4BackendContract }).__WEBOS_BACKEND__) {
      return (window as unknown as { __WEBOS_BACKEND__: IMember4BackendContract }).__WEBOS_BACKEND__;
    }
    return null;
  }

  async getCurrentUser(): Promise<UserProfile> {
    if (this.externalBackend) {
      return this.externalBackend.getCurrentUser();
    }
    return {
      id: 'usr-101',
      username: 'developer',
      displayName: 'WebOS Administrator',
      role: 'admin',
      avatarUrl: '',
    };
  }

  async saveUserSettings(payload: DesktopSyncPayload): Promise<boolean> {
    if (this.externalBackend) {
      return this.externalBackend.saveUserSettings(payload);
    }
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.storageKey, JSON.stringify(payload));
      }
      return true;
    } catch {
      return false;
    }
  }

  async loadUserSettings(): Promise<DesktopSyncPayload | null> {
    if (this.externalBackend) {
      return this.externalBackend.loadUserSettings();
    }
    try {
      if (typeof localStorage !== 'undefined') {
        const item = localStorage.getItem(this.storageKey);
        if (item) return JSON.parse(item);
      }
    } catch (e) {
      console.warn('Failed to read local user settings:', e);
    }
    return null;
  }

  subscribeToSyncEvents(listener: (payload: DesktopSyncPayload) => void): () => void {
    if (this.externalBackend) {
      return this.externalBackend.subscribeToSyncEvents(listener);
    }
    this.syncListeners.add(listener);
    return () => {
      this.syncListeners.delete(listener);
    };
  }

  async uploadWallpaperAsset(_file: Blob, _name: string): Promise<string> {
    if (this.externalBackend) {
      return this.externalBackend.uploadWallpaperAsset(_file, _name);
    }
    return 'blob:local-wallpaper-mock';
  }
}

export const member4Bridge = Member4BackendBridge.getInstance();
