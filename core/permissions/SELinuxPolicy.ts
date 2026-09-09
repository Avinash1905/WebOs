/**
 * @file SELinuxPolicy.ts
 * @description Mandatory Access Control (MAC) Type Enforcement and Access Vector Cache (AVC).
 */

export interface SELinuxSecurityContext {
  readonly user: string;      // e.g. system_u, user_u
  readonly role: string;      // e.g. system_r, user_r
  readonly type: string;      // e.g. kernel_t, httpd_t, user_home_t
  readonly mlsLevel: string;  // e.g. s0, s0:c0.c1023
}

export interface AccessVectorRule {
  readonly sourceContext: string; // source type
  readonly targetContext: string; // target type
  readonly targetClass: string;   // file, process, socket, shm
  readonly permissions: readonly string[]; // read, write, execute, getattr, transition
}

export type SELinuxMode = 'ENFORCING' | 'PERMISSIVE' | 'DISABLED';

/**
 * Implements Security-Enhanced Linux (SELinux) MAC security model.
 */
export class SELinuxPolicy {
  private _mode: SELinuxMode = 'ENFORCING';
  private readonly _rules = new Map<string, Set<string>>();
  private readonly _avcCache = new Map<string, boolean>();

  constructor() {
    this.initDefaultRules();
  }

  public setMode(mode: SELinuxMode): void {
    this._mode = mode;
    this._avcCache.clear();
  }

  public getMode(): SELinuxMode {
    return this._mode;
  }

  /**
   * Adds an allow rule: allow <source_type> <target_type>:<class> { <permissions> }
   */
  public allow(sourceType: string, targetType: string, targetClass: string, permissions: string[]): void {
    const key = `${sourceType}:${targetType}:${targetClass}`;
    let permSet = this._rules.get(key);
    if (!permSet) {
      permSet = new Set();
      this._rules.set(key, permSet);
    }
    for (const p of permissions) {
      permSet.add(p);
    }
    this._avcCache.clear();
  }

  /**
   * Checks access authorization using Access Vector Cache (AVC).
   */
  public checkAccess(
    source: SELinuxSecurityContext,
    target: SELinuxSecurityContext,
    targetClass: string,
    permission: string
  ): boolean {
    if (this._mode === 'DISABLED') return true;

    const cacheKey = `${source.type}->${target.type}:${targetClass}:${permission}`;
    if (this._avcCache.has(cacheKey)) {
      return this._avcCache.get(cacheKey)!;
    }

    const ruleKey = `${source.type}:${target.type}:${targetClass}`;
    const allowedPerms = this._rules.get(ruleKey);
    const isAllowed = allowedPerms ? allowedPerms.has(permission) : false;

    this._avcCache.set(cacheKey, isAllowed);

    if (!isAllowed && this._mode === 'PERMISSIVE') {
      return true; // Log but allow
    }

    return isAllowed;
  }

  /**
   * Formats a security context into standard string format: user:role:type:level
   */
  public formatContext(ctx: SELinuxSecurityContext): string {
    return `${ctx.user}:${ctx.role}:${ctx.type}:${ctx.mlsLevel}`;
  }

  /**
   * Parses standard security context string.
   */
  public parseContext(raw: string): SELinuxSecurityContext {
    const parts = raw.split(':');
    return {
      user: parts[0] || 'system_u',
      role: parts[1] || 'system_r',
      type: parts[2] || 'unconfined_t',
      mlsLevel: parts[3] || 's0',
    };
  }

  private initDefaultRules(): void {
    // Kernel domain defaults
    this.allow('kernel_t', 'system_data_t', 'file', ['read', 'write', 'execute', 'getattr']);
    this.allow('kernel_t', 'user_data_t', 'file', ['read', 'write', 'getattr']);
    this.allow('user_t', 'user_data_t', 'file', ['read', 'write', 'execute', 'getattr']);
    this.allow('user_t', 'system_data_t', 'file', ['read', 'getattr']);
  }
}
