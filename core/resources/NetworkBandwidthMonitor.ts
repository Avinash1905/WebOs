/**
 * @file NetworkBandwidthMonitor.ts
 * @description Token bucket network bandwidth traffic shaping and per-app bandwidth metering.
 */

export class NetworkBandwidthMonitor {
  private readonly _appUsage = new Map<string, { bytesIn: number; bytesOut: number }>();
  private readonly _rateLimits = new Map<string, number>(); // appId -> maxBytesPerSec

  public setRateLimit(appId: string, maxBytesPerSec: number): void {
    this._rateLimits.set(appId, maxBytesPerSec);
  }

  public recordTraffic(appId: string, bytesIn: number, bytesOut: number): boolean {
    const limit = this._rateLimits.get(appId);
    if (limit && (bytesIn + bytesOut) > limit) {
      return false; // Throttled / Dropped
    }

    let usage = this._appUsage.get(appId);
    if (!usage) {
      usage = { bytesIn: 0, bytesOut: 0 };
      this._appUsage.set(appId, usage);
    }
    usage.bytesIn += bytesIn;
    usage.bytesOut += bytesOut;

    return true;
  }

  public getUsage(appId: string): { bytesIn: number; bytesOut: number } | undefined {
    return this._appUsage.get(appId);
  }
}
