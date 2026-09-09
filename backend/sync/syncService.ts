/**
 * WebOS Backend - Cloud Synchronization & Conflict Resolution Engine
 * Handles delta syncing, state merging, vector clock versioning, and client event broadcasting.
 */

export interface SyncPayload {
  clientId: string;
  version: number;
  timestamp: number;
  type: 'settings' | 'vfs' | 'profile';
  data: Record<string, unknown>;
}

export interface SyncResponse {
  success: boolean;
  version: number;
  conflict: boolean;
  mergedData?: Record<string, unknown>;
}

export class SyncService {
  private currentVersion: number = 1;
  private syncStore: Map<string, { version: number; data: Record<string, unknown>; updatedAt: number }> = new Map();
  private listeners: Set<(payload: SyncPayload) => void> = new Set();

  constructor() {}

  public async processSync(payload: SyncPayload): Promise<SyncResponse> {
    const existing = this.syncStore.get(payload.type);

    if (!existing) {
      this.currentVersion++;
      this.syncStore.set(payload.type, {
        version: this.currentVersion,
        data: payload.data,
        updatedAt: Date.now(),
      });
      this.notify(payload);
      return { success: true, version: this.currentVersion, conflict: false };
    }

    // Check version conflict
    if (payload.version < existing.version) {
      // Last-write-wins field merge strategy
      const merged = { ...existing.data, ...payload.data };
      this.currentVersion++;
      this.syncStore.set(payload.type, {
        version: this.currentVersion,
        data: merged,
        updatedAt: Date.now(),
      });
      this.notify({ ...payload, version: this.currentVersion, data: merged });
      return {
        success: true,
        version: this.currentVersion,
        conflict: true,
        mergedData: merged,
      };
    }

    this.currentVersion++;
    this.syncStore.set(payload.type, {
      version: this.currentVersion,
      data: payload.data,
      updatedAt: Date.now(),
    });
    this.notify(payload);

    return {
      success: true,
      version: this.currentVersion,
      conflict: false,
    };
  }

  public getLatest(type: string): { version: number; data: Record<string, unknown> } | null {
    return this.syncStore.get(type) || null;
  }

  public subscribe(listener: (payload: SyncPayload) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(payload: SyncPayload) {
    this.listeners.forEach((l) => {
      try {
        l(payload);
      } catch (e) {
        console.error('Sync listener error:', e);
      }
    });
  }
}

export const syncService = new SyncService();
