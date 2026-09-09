/**
 * @file InotifySystemWatcher.ts
 * @description Linux inotify kernel file monitoring subsystem (IN_CREATE, IN_MODIFY, IN_DELETE).
 */

export enum InotifyMask {
  IN_ACCESS = 0x00000001,
  IN_MODIFY = 0x00000002,
  IN_ATTRIB = 0x00000004,
  IN_CLOSE_WRITE = 0x00000008,
  IN_OPEN = 0x00000020,
  IN_MOVED_FROM = 0x00000040,
  IN_MOVED_TO = 0x00000080,
  IN_CREATE = 0x00000100,
  IN_DELETE = 0x00000200,
}

export interface InotifyEvent {
  readonly wd: number; // Watch descriptor
  readonly mask: number;
  readonly cookie: number;
  readonly name: string;
}

export class InotifySystemWatcher {
  private _nextWd = 1;
  private readonly _watches = new Map<number, { path: string; mask: number }>();
  private readonly _eventQueue: InotifyEvent[] = [];

  public addWatch(path: string, mask: number): number {
    const wd = this._nextWd++;
    this._watches.set(wd, { path, mask });
    return wd;
  }

  public removeWatch(wd: number): boolean {
    return this._watches.delete(wd);
  }

  public triggerEvent(path: string, mask: number, name: string): void {
    for (const [wd, watch] of this._watches.entries()) {
      if (path.startsWith(watch.path) && (watch.mask & mask) !== 0) {
        this._eventQueue.push({
          wd,
          mask,
          cookie: 0,
          name,
        });
      }
    }
  }

  public pollEvents(): InotifyEvent[] {
    const events = [...this._eventQueue];
    this._eventQueue.length = 0;
    return events;
  }
}
