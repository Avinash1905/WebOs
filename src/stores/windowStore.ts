import { create } from 'zustand';
import type { WindowInstance, WindowBounds } from '../types/window';

const DEFAULT_WINDOW_WIDTH = 780;
const DEFAULT_WINDOW_HEIGHT = 520;

let zIndexCounter = 100;

interface WindowStoreState {
  windows: WindowInstance[];
  activeWindowId: string | null;
  focusedWindowId: string | null;

  openWindow: (windowConfig: Omit<WindowInstance, 'isFocused' | 'zIndex' | 'state' | 'bounds'> & {
    state?: WindowInstance['state'];
    bounds?: Partial<WindowBounds>;
  }) => string;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  toggleMinimize: (id: string) => void;
  updateWindowBounds: (id: string, bounds: Partial<WindowBounds>) => void;
}

export const useWindowStore = create<WindowStoreState>((set, get) => ({
  windows: [],
  activeWindowId: null,
  focusedWindowId: null,

  openWindow: (config) => {
    const { windows } = get();
    // Check if single instance already exists
    const existing = windows.find((w) => w.id === config.id || w.appId === config.appId);
    if (existing) {
      if (existing.state === 'minimized') {
        get().restoreWindow(existing.id);
      }
      get().focusWindow(existing.id);
      return existing.id;
    }

    zIndexCounter += 1;
    const cascadeOffset = (windows.length % 8) * 28;
    const defaultBounds: WindowBounds = {
      x: Math.max(40, (window.innerWidth ? window.innerWidth / 2 - DEFAULT_WINDOW_WIDTH / 2 : 100) + cascadeOffset),
      y: Math.max(40, (window.innerHeight ? window.innerHeight / 2 - DEFAULT_WINDOW_HEIGHT / 2 - 30 : 60) + cascadeOffset),
      width: config.bounds?.width ?? DEFAULT_WINDOW_WIDTH,
      height: config.bounds?.height ?? DEFAULT_WINDOW_HEIGHT,
      ...config.bounds,
    };

    const newWindow: WindowInstance = {
      ...config,
      state: config.state ?? 'normal',
      bounds: defaultBounds,
      isFocused: true,
      zIndex: zIndexCounter,
      canMinimize: config.canMinimize ?? true,
      canMaximize: config.canMaximize ?? true,
      canClose: config.canClose ?? true,
    };

    set((state) => ({
      windows: state.windows.map((w) => ({ ...w, isFocused: false })).concat(newWindow),
      activeWindowId: newWindow.id,
      focusedWindowId: newWindow.id,
    }));

    return newWindow.id;
  },

  closeWindow: (id) =>
    set((state) => {
      const remaining = state.windows.filter((w) => w.id !== id);
      const nextFocused = remaining.length > 0 ? remaining[remaining.length - 1].id : null;
      return {
        windows: remaining.map((w) => (w.id === nextFocused ? { ...w, isFocused: true } : w)),
        activeWindowId: nextFocused,
        focusedWindowId: nextFocused,
      };
    }),

  focusWindow: (id) =>
    set((state) => {
      zIndexCounter += 1;
      return {
        windows: state.windows.map((w) => ({
          ...w,
          isFocused: w.id === id,
          zIndex: w.id === id ? zIndexCounter : w.zIndex,
        })),
        activeWindowId: id,
        focusedWindowId: id,
      };
    }),

  minimizeWindow: (id) =>
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, state: 'minimized', isFocused: false } : w
      ),
      activeWindowId: state.activeWindowId === id ? null : state.activeWindowId,
      focusedWindowId: state.focusedWindowId === id ? null : state.focusedWindowId,
    })),

  maximizeWindow: (id) =>
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, state: 'maximized', isFocused: true } : { ...w, isFocused: false }
      ),
      activeWindowId: id,
      focusedWindowId: id,
    })),

  restoreWindow: (id) =>
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, state: 'normal', isFocused: true } : { ...w, isFocused: false }
      ),
      activeWindowId: id,
      focusedWindowId: id,
    })),

  toggleMinimize: (id) => {
    const win = get().windows.find((w) => w.id === id);
    if (!win) return;
    if (win.state === 'minimized') {
      get().restoreWindow(id);
      get().focusWindow(id);
    } else if (win.isFocused) {
      get().minimizeWindow(id);
    } else {
      get().focusWindow(id);
    }
  },

  updateWindowBounds: (id, newBounds) =>
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, bounds: { ...w.bounds, ...newBounds } } : w
      ),
    })),
}));
