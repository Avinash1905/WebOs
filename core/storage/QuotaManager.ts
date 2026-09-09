/**
 * @file QuotaManager.ts
 * @description Storage quota monitoring and threshold warning management for WebOS.
 */

import type { EventBus } from '../events/index.js';
import type { QuotaInfo } from './types.js';

/**
 * Manages browser storage estimation and threshold warning notifications.
 */
export class QuotaManager {
  private readonly _warningThreshold: number;
  private readonly _criticalThreshold: number;
  private _lastWarningEmitted = 0;

  constructor(warningThreshold: number = 0.80, criticalThreshold: number = 0.90) {
    this._warningThreshold = Math.min(1, Math.max(0, warningThreshold));
    this._criticalThreshold = Math.min(1, Math.max(0, criticalThreshold));
  }

  public get warningThreshold(): number {
    return this._warningThreshold;
  }

  public get criticalThreshold(): number {
    return this._criticalThreshold;
  }

  /**
   * Retrieves storage quota and usage information from the browser.
   */
  public async getQuotaInfo(): Promise<QuotaInfo> {
    if (
      typeof navigator === 'undefined' ||
      !navigator.storage ||
      typeof navigator.storage.estimate !== 'function'
    ) {
      return { supported: false };
    }

    try {
      const estimate = await navigator.storage.estimate();
      const quotaBytes = estimate.quota;
      const usedBytes = estimate.usage;

      if (quotaBytes === undefined || usedBytes === undefined || quotaBytes <= 0) {
        return {
          supported: true,
          quotaBytes,
          usedBytes,
        };
      }

      const availableBytes = Math.max(0, quotaBytes - usedBytes);
      const percentUsed = usedBytes / quotaBytes;

      return {
        supported: true,
        quotaBytes,
        usedBytes,
        availableBytes,
        percentUsed,
      };
    } catch (err) {
      console.warn('[QuotaManager] Failed to estimate storage quota:', err);
      return { supported: false };
    }
  }

  /**
   * Checks the storage quota and emits an event on EventBus if warning/critical thresholds are crossed.
   *
   * @param eventBus - Optional EventBus instance.
   */
  public async checkQuota(eventBus?: EventBus): Promise<QuotaInfo> {
    const info = await this.getQuotaInfo();

    if (!info.supported || info.percentUsed === undefined || !eventBus) {
      return info;
    }

    if (info.percentUsed >= this._warningThreshold) {
      const now = Date.now();
      // Throttle warning emissions to at most once per 30 seconds
      if (now - this._lastWarningEmitted > 30000) {
        this._lastWarningEmitted = now;
        eventBus.emit(
          'STORAGE_QUOTA_WARNING',
          {
            usedBytes: info.usedBytes ?? 0,
            maxBytes: info.quotaBytes ?? 0,
            percentUsed: Math.round(info.percentUsed * 100),
          },
          { source: 'storage' }
        );
      }
    }

    return info;
  }
}
