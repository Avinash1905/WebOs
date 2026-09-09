/**
 * @file KernelWatchdogMonitor.ts
 * @description Hardlock / softlock watchdog timer with thread heartbeat pinging and auto-panic.
 */

export class KernelWatchdogMonitor {
  private readonly _heartbeats = new Map<string, number>(); // threadName -> lastPingTimestamp
  private readonly _timeoutMs: number;

  constructor(timeoutMs: number = 5000) {
    this._timeoutMs = timeoutMs;
  }

  public ping(threadName: string, now: number = Date.now()): void {
    this._heartbeats.set(threadName, now);
  }

  public checkHang(now: number = Date.now()): { isHanging: boolean; hungThreads: string[] } {
    const hungThreads: string[] = [];
    for (const [name, lastPing] of this._heartbeats.entries()) {
      if (now - lastPing > this._timeoutMs) {
        hungThreads.push(name);
      }
    }
    return {
      isHanging: hungThreads.length > 0,
      hungThreads,
    };
  }

  public unregister(threadName: string): void {
    this._heartbeats.delete(threadName);
  }
}
