/**
 * @file MultiWindowManager.ts
 * @description Multi-window state, z-index layering, and viewport placement coordinator.
 */

export type WindowState = 'NORMAL' | 'MINIMIZED' | 'MAXIMIZED' | 'FULLSCREEN';

export interface WindowDescriptor {
  readonly windowId: string;
  readonly appId: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  state: WindowState;
  isFocused: boolean;
}

export class MultiWindowManager {
  private readonly windows = new Map<string, WindowDescriptor>();
  private nextZIndex = 100;
  private focusedWindowId: string | null = null;

  public createWindow(appId: string, options?: { title?: string; width?: number; height?: number; x?: number; y?: number }): WindowDescriptor {
    const windowId = `win_${appId}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const count = this.windows.size;
    const cascadeOffset = (count % 10) * 30;

    const win: WindowDescriptor = {
      windowId,
      appId,
      title: options?.title ?? appId,
      x: options?.x ?? 100 + cascadeOffset,
      y: options?.y ?? 100 + cascadeOffset,
      width: options?.width ?? 640,
      height: options?.height ?? 480,
      zIndex: this.nextZIndex++,
      state: 'NORMAL',
      isFocused: false
    };

    this.windows.set(windowId, win);
    this.focusWindow(windowId);
    return win;
  }

  public focusWindow(windowId: string): boolean {
    const target = this.windows.get(windowId);
    if (!target) return false;

    for (const win of this.windows.values()) {
      win.isFocused = win.windowId === windowId;
    }

    target.zIndex = this.nextZIndex++;
    this.focusedWindowId = windowId;
    return true;
  }

  public setWindowState(windowId: string, state: WindowState): boolean {
    const win = this.windows.get(windowId);
    if (!win) return false;
    win.state = state;
    return true;
  }

  public closeWindow(windowId: string): boolean {
    const deleted = this.windows.delete(windowId);
    if (this.focusedWindowId === windowId) {
      this.focusedWindowId = null;
      // Focus top-most remaining window
      let topWin: WindowDescriptor | undefined;
      for (const win of this.windows.values()) {
        if (!topWin || win.zIndex > topWin.zIndex) {
          topWin = win;
        }
      }
      if (topWin) {
        this.focusWindow(topWin.windowId);
      }
    }
    return deleted;
  }

  public getFocusedWindow(): WindowDescriptor | undefined {
    return this.focusedWindowId ? this.windows.get(this.focusedWindowId) : undefined;
  }

  public getWindowsByApp(appId: string): readonly WindowDescriptor[] {
    return Array.from(this.windows.values()).filter(w => w.appId === appId);
  }

  public listWindows(): readonly WindowDescriptor[] {
    return Array.from(this.windows.values());
  }

  public clear(): void {
    this.windows.clear();
    this.focusedWindowId = null;
  }
}
