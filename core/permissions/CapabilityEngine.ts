/**
 * @file CapabilityEngine.ts
 * @description Fine-grained Linux/POSIX-style capability engine (CAP_SYS_ADMIN, CAP_NET_ADMIN, CAP_DAC_OVERRIDE).
 */

export enum POSIXCapability {
  CAP_CHOWN = 1 << 0,
  CAP_DAC_OVERRIDE = 1 << 1,
  CAP_DAC_READ_SEARCH = 1 << 2,
  CAP_FOWNER = 1 << 3,
  CAP_KILL = 1 << 4,
  CAP_SETGID = 1 << 5,
  CAP_SETUID = 1 << 6,
  CAP_NET_BIND_SERVICE = 1 << 7,
  CAP_NET_ADMIN = 1 << 8,
  CAP_SYS_ADMIN = 1 << 9,
  CAP_SYS_BOOT = 1 << 10,
  CAP_SYS_RESOURCE = 1 << 11,
  CAP_SYS_TIME = 1 << 12,
  CAP_AUDIT_WRITE = 1 << 13,
}

export interface CapabilitySet {
  readonly effective: number;
  readonly permitted: number;
  readonly inheritable: number;
  readonly bounding: number;
}

/**
 * Manages fine-grained capability sets for threads and processes.
 */
export class CapabilityEngine {
  private readonly _processCapabilities = new Map<number, CapabilitySet>();

  /**
   * Initializes capability set for a process PID.
   */
  public initProcess(pid: number, isRoot: boolean = false): CapabilitySet {
    const fullMask = isRoot
      ? (1 << 14) - 1 // All 14 capabilities
      : POSIXCapability.CAP_KILL; // Unprivileged process default

    const caps: CapabilitySet = {
      effective: fullMask,
      permitted: fullMask,
      inheritable: 0,
      bounding: (1 << 14) - 1,
    };

    this._processCapabilities.set(pid, caps);
    return caps;
  }

  /**
   * Checks if process has a specific capability in its effective set.
   */
  public hasCapability(pid: number, cap: POSIXCapability): boolean {
    const set = this._processCapabilities.get(pid);
    if (!set) return false;
    // Check if cap is set in effective set
    return (set.effective & cap) === cap;
  }

  /**
   * Drops a capability from effective set.
   */
  public dropCapability(pid: number, cap: POSIXCapability): boolean {
    const set = this._processCapabilities.get(pid);
    if (!set) return false;

    const newEffective = set.effective & ~cap;
    this._processCapabilities.set(pid, {
      ...set,
      effective: newEffective,
    });
    return true;
  }

  /**
   * Raises a permitted capability into the effective set.
   */
  public raiseCapability(pid: number, cap: POSIXCapability): boolean {
    const set = this._processCapabilities.get(pid);
    if (!set) return false;

    // Can only raise if permitted
    if ((set.permitted & cap) !== cap) {
      return false;
    }

    this._processCapabilities.set(pid, {
      ...set,
      effective: set.effective | cap,
    });
    return true;
  }

  /**
   * Clones capabilities on fork.
   */
  public forkCapabilities(parentPid: number, childPid: number): CapabilitySet {
    const parent = this._processCapabilities.get(parentPid) ?? this.initProcess(parentPid, false);
    const child: CapabilitySet = {
      effective: parent.effective & parent.bounding,
      permitted: parent.permitted & parent.bounding,
      inheritable: parent.inheritable,
      bounding: parent.bounding,
    };
    this._processCapabilities.set(childPid, child);
    return child;
  }

  /**
   * Removes process record upon termination.
   */
  public cleanup(pid: number): void {
    this._processCapabilities.delete(pid);
  }
}
