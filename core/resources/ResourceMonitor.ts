/**
 * @file ResourceMonitor.ts
 * @description Periodic interval monitor with threshold alerting and event broadcasting.
 */

import type { EventBus } from '../events/index.js';
import { RESOURCE_EVENTS } from './ResourceEvents.js';
import type { ResourceSnapshot } from './types.js';

export class ResourceMonitor {
  private _intervalId: any = null;
  private _intervalMs: number;
  private readonly _eventBus?: EventBus;
  private readonly _snapshotFn: () => Promise<ResourceSnapshot>;

  constructor(
    snapshotFn: () => Promise<ResourceSnapshot>,
    eventBus?: EventBus,
    intervalMs = 5000
  ) {
    this._snapshotFn = snapshotFn;
    this._eventBus = eventBus;
    this._intervalMs = Math.max(1000, intervalMs);
  }

  public start(intervalMs?: number): void {
    if (this._intervalId) {
      this.stop();
    }
    if (intervalMs) {
      this._intervalMs = Math.max(1000, intervalMs);
    }

    this._intervalId = setInterval(async () => {
      try {
        const snapshot = await this._snapshotFn();
        this._checkThresholds(snapshot);
      } catch (err) {
        console.error('[ResourceMonitor] Error collecting snapshot:', err);
      }
    }, this._intervalMs);
  }

  public stop(): void {
    if (this._intervalId) {
      clearInterval(this._intervalId);
      this._intervalId = null;
    }
  }

  public isRunning(): boolean {
    return this._intervalId !== null;
  }

  private _checkThresholds(snapshot: ResourceSnapshot): void {
    if (!this._eventBus) return;

    this._eventBus.emit(RESOURCE_EVENTS.SNAPSHOT_CREATED as any, {
      snapshot,
      timestamp: Date.now(),
    } as any);

    if (snapshot.memory.status === 'WARNING' || snapshot.memory.status === 'CRITICAL') {
      this._eventBus.emit(RESOURCE_EVENTS.MEMORY_WARNING as any, {
        memory: snapshot.memory,
        timestamp: Date.now(),
      } as any);
    }

    if (snapshot.storage.status === 'WARNING') {
      this._eventBus.emit(RESOURCE_EVENTS.STORAGE_WARNING as any, {
        storage: snapshot.storage,
        timestamp: Date.now(),
      } as any);
    } else if (snapshot.storage.status === 'CRITICAL') {
      this._eventBus.emit(RESOURCE_EVENTS.STORAGE_CRITICAL as any, {
        storage: snapshot.storage,
        timestamp: Date.now(),
      } as any);
    }
  }
}
