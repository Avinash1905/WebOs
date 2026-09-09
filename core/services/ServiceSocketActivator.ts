/**
 * @file ServiceSocketActivator.ts
 * @description Systemd socket-based activation simulation for on-demand lazy service startup.
 */

export class ServiceSocketActivator {
  private readonly _socketRegistry = new Map<string, string>(); // socketPath -> serviceName
  private readonly _activeServices = new Set<string>();

  public registerSocket(socketPath: string, targetService: string): void {
    this._socketRegistry.set(socketPath, targetService);
  }

  public onConnection(socketPath: string, activator: (serviceName: string) => Promise<void> | void): string | null {
    const target = this._socketRegistry.get(socketPath);
    if (!target) return null;

    if (!this._activeServices.has(target)) {
      this._activeServices.add(target);
      activator(target);
    }

    return target;
  }

  public isServiceActive(serviceName: string): boolean {
    return this._activeServices.has(serviceName);
  }

  public markServiceStopped(serviceName: string): void {
    this._activeServices.delete(serviceName);
  }
}
