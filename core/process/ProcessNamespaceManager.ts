/**
 * @file ProcessNamespaceManager.ts
 * @description Linux-style namespaces (PID, Mount, Network, IPC, UTS) isolation manager.
 */

export interface ProcessNamespaceContext {
  readonly pidNamespaceId: number;
  readonly mountNamespaceId: number;
  readonly netNamespaceId: number;
}

export class ProcessNamespaceManager {
  private _nextNsId = 1;
  private readonly _processNamespaces = new Map<number, ProcessNamespaceContext>(); // PID -> Context

  public createNamespace(): ProcessNamespaceContext {
    const ns: ProcessNamespaceContext = {
      pidNamespaceId: this._nextNsId++,
      mountNamespaceId: this._nextNsId++,
      netNamespaceId: this._nextNsId++,
    };
    return ns;
  }

  public assignProcessToNamespace(pid: number, ns: ProcessNamespaceContext): void {
    this._processNamespaces.set(pid, ns);
  }

  public getProcessNamespace(pid: number): ProcessNamespaceContext | undefined {
    return this._processNamespaces.get(pid);
  }

  public unshare(pid: number): ProcessNamespaceContext {
    const newNs = this.createNamespace();
    this._processNamespaces.set(pid, newNs);
    return newNs;
  }
}
