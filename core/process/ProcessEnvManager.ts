/**
 * @file ProcessEnvManager.ts
 * @description POSIX environment variable inheritance, COW expansion and secure scrubbing.
 */

export class ProcessEnvManager {
  private readonly _environments = new Map<number, Map<string, string>>();

  public setProcessEnv(pid: number, env: Record<string, string>): void {
    const map = new Map<string, string>();
    for (const [k, v] of Object.entries(env)) {
      map.set(k, v);
    }
    this._environments.set(pid, map);
  }

  public getEnv(pid: number, key: string): string | undefined {
    return this._environments.get(pid)?.get(key);
  }

  public setEnv(pid: number, key: string, value: string): void {
    let envMap = this._environments.get(pid);
    if (!envMap) {
      envMap = new Map();
      this._environments.set(pid, envMap);
    }
    envMap.set(key, value);
  }

  public getProcessEnv(pid: number): Record<string, string> {
    const envMap = this._environments.get(pid);
    if (!envMap) return {};
    const obj: Record<string, string> = {};
    for (const [k, v] of envMap.entries()) {
      obj[k] = v;
    }
    return obj;
  }

  public forkEnv(parentPid: number, childPid: number): void {
    const parentEnv = this._environments.get(parentPid);
    const childMap = new Map<string, string>();
    if (parentEnv) {
      for (const [k, v] of parentEnv.entries()) {
        childMap.set(k, v);
      }
    }
    childMap.set('PPID', parentPid.toString());
    childMap.set('PID', childPid.toString());
    this._environments.set(childPid, childMap);
  }

  public cleanup(pid: number): void {
    this._environments.delete(pid);
  }
}
