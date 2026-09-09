/**
 * @file SandboxIsolationEngine.ts
 * @description Boundary sandbox enforcement for unprivileged application execution.
 */

export interface SandboxPolicy {
  readonly appId: string;
  readonly allowedPaths: readonly string[]; // Read/Write whitelist
  readonly readOnlyPaths: readonly string[];
  readonly allowNetwork: boolean;
  readonly allowClipboard: boolean;
  readonly allowNotifications: boolean;
  readonly maxMemoryMB: number;
}

export class SandboxIsolationEngine {
  private readonly _sandboxes = new Map<string, SandboxPolicy>();

  public createSandbox(policy: SandboxPolicy): void {
    this._sandboxes.set(policy.appId, policy);
  }

  public checkPathAccess(appId: string, path: string, write: boolean = false): boolean {
    const policy = this._sandboxes.get(appId);
    if (!policy) return false;

    // Check RW paths
    for (const allowed of policy.allowedPaths) {
      if (path.startsWith(allowed)) return true;
    }

    // Check RO paths if read-only
    if (!write) {
      for (const ro of policy.readOnlyPaths) {
        if (path.startsWith(ro)) return true;
      }
    }

    return false;
  }

  public checkNetworkAccess(appId: string): boolean {
    const policy = this._sandboxes.get(appId);
    return policy ? policy.allowNetwork : false;
  }

  public checkClipboardAccess(appId: string): boolean {
    const policy = this._sandboxes.get(appId);
    return policy ? policy.allowClipboard : false;
  }

  public getSandbox(appId: string): SandboxPolicy | undefined {
    return this._sandboxes.get(appId);
  }

  public removeSandbox(appId: string): boolean {
    return this._sandboxes.delete(appId);
  }
}
