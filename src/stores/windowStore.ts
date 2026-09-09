import { create } from 'zustand';
import type { WindowInstance, WindowBounds, WindowManagerStore, WindowStateMode } from '../types/window';
import {
  calculateSnapBounds,
  clampBoundsToViewport,
  getViewportDimensions,
  DEFAULT_MIN_WIDTH,
  DEFAULT_MIN_HEIGHT,
} from '../wm/WindowGeometry';

const DEFAULT_WINDOW_WIDTH = 780;
const DEFAULT_WINDOW_HEIGHT = 520;

let zIndexCounter = 100;

export const useWindowStore = create<WindowManagerStore>((set, get) => ({
  windows: [],
  activeWindowId: null,
  focusedWindowId: null,
  hoveredSnapZone: 'none',
  activeSnapPreviewBounds: null,
  isAltTabOpen: false,
  altTabIndex: 0,
  showDesktop: false,

  openWindow: (config) => {
    const { windows } = get();
    // Check if single instance already exists
    const existing = windows.find((w) => w.id === config.id || (config.appId && w.appId === config.appId));
    if (existing) {
      if (existing.state === 'minimized') {
        get().restoreWindow(existing.id);
      }
      get().focusWindow(existing.id);
      return existing.id;
    }

    zIndexCounter += 1;
    const viewport = getViewportDimensions();
    const cascadeOffset = (windows.length % 8) * 28;
    const defaultX = Math.max(40, Math.floor(viewport.width / 2 - DEFAULT_WINDOW_WIDTH / 2) + cascadeOffset);
    const defaultY = Math.max(40, Math.floor(viewport.availableHeight / 2 - DEFAULT_WINDOW_HEIGHT / 2) + cascadeOffset);

    const rawBounds: WindowBounds = {
      x: config.bounds?.x ?? defaultX,
      y: config.bounds?.y ?? defaultY,
      width: config.bounds?.width ?? DEFAULT_WINDOW_WIDTH,
      height: config.bounds?.height ?? DEFAULT_WINDOW_HEIGHT,
    };

    const bounds = clampBoundsToViewport(
      rawBounds,
      config.minWidth ?? DEFAULT_MIN_WIDTH,
      config.minHeight ?? DEFAULT_MIN_HEIGHT,
      viewport
    );

    const now = Date.now();
    const newWindow: WindowInstance = {
      ...config,
      state: config.state ?? 'normal',
      bounds,
      previousBounds: bounds,
      isFocused: true,
      zIndex: zIndexCounter,
      canMinimize: config.canMinimize ?? true,
      canMaximize: config.canMaximize ?? true,
      canClose: config.canClose ?? true,
      canResize: config.canResize ?? true,
      canDrag: config.canDrag ?? true,
      createdAt: now,
      updatedAt: now,
    };

    set((state) => ({
      windows: state.windows.map((w) => ({ ...w, isFocused: false })).concat(newWindow),
      activeWindowId: newWindow.id,
      focusedWindowId: newWindow.id,
      showDesktop: false,
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

  closeAllWindows: (appId) =>
    set((state) => {
      const remaining = appId
        ? state.windows.filter((w) => w.appId !== appId)
        : [];
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

  bringToFront: (id) => {
    get().focusWindow(id);
  },

  minimizeWindow: (id) =>
    set((state) => {
      const remaining = state.windows.filter((w) => w.id !== id && w.state !== 'minimized');
      const nextFocused = remaining.length > 0 ? remaining[remaining.length - 1].id : null;

      return {
        windows: state.windows.map((w) =>
          w.id === id
            ? { ...w, state: 'minimized', isFocused: false, updatedAt: Date.now() }
            : w.id === nextFocused
            ? { ...w, isFocused: true }
            : w
        ),
        activeWindowId: nextFocused,
        focusedWindowId: nextFocused,
      };
    }),

  maximizeWindow: (id) =>
    set((state) => {
      zIndexCounter += 1;
      return {
        windows: state.windows.map((w) =>
          w.id === id
            ? {
                ...w,
                previousBounds: w.state === 'normal' ? w.bounds : w.previousBounds,
                state: 'maximized',
                isFocused: true,
                zIndex: zIndexCounter,
                updatedAt: Date.now(),
              }
            : { ...w, isFocused: false }
        ),
        activeWindowId: id,
        focusedWindowId: id,
      };
    }),

  restoreWindow: (id) =>
    set((state) => {
      zIndexCounter += 1;
      return {
        windows: state.windows.map((w) =>
          w.id === id
            ? {
                ...w,
                state: 'normal',
                bounds: w.previousBounds ?? w.bounds,
                isFocused: true,
                zIndex: zIndexCounter,
                updatedAt: Date.now(),
              }
            : { ...w, isFocused: false }
        ),
        activeWindowId: id,
        focusedWindowId: id,
      };
    }),

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

  toggleMaximize: (id) => {
    const win = get().windows.find((w) => w.id === id);
    if (!win) return;
    if (win.state === 'maximized' || win.state.startsWith('snapped-') || win.state === 'fullscreen') {
      get().restoreWindow(id);
    } else {
      get().maximizeWindow(id);
    }
  },

  toggleFullscreen: (id) =>
    set((state) => {
      const win = state.windows.find((w) => w.id === id);
      if (!win) return state;
      zIndexCounter += 1;
      const isFullscreen = win.state === 'fullscreen';

      return {
        windows: state.windows.map((w) =>
          w.id === id
            ? {
                ...w,
                previousBounds: !isFullscreen ? w.bounds : w.previousBounds,
                state: isFullscreen ? 'normal' : 'fullscreen',
                isFocused: true,
                zIndex: zIndexCounter,
                updatedAt: Date.now(),
              }
            : { ...w, isFocused: false }
        ),
        activeWindowId: id,
        focusedWindowId: id,
      };
    }),

  snapWindow: (id, zone) => {
    if (zone === 'none') return;
    const snapBounds = calculateSnapBounds(zone);
    const snapState: WindowStateMode =
      zone === 'top' ? 'maximized' : (`snapped-${zone}` as WindowStateMode);

    zIndexCounter += 1;
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id
          ? {
              ...w,
              previousBounds: w.state === 'normal' ? w.bounds : w.previousBounds,
              state: snapState,
              bounds: snapBounds,
              isFocused: true,
              zIndex: zIndexCounter,
              updatedAt: Date.now(),
            }
          : { ...w, isFocused: false }
      ),
      activeWindowId: id,
      focusedWindowId: id,
      hoveredSnapZone: 'none',
      activeSnapPreviewBounds: null,
    }));
  },

  updateWindowBounds: (id, newBounds) =>
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id
          ? {
              ...w,
              bounds: { ...w.bounds, ...newBounds },
              previousBounds: w.state === 'normal' ? { ...w.bounds, ...newBounds } : w.previousBounds,
              updatedAt: Date.now(),
            }
          : w
      ),
    })),

  setHoveredSnapZone: (zone, bounds) =>
    set({
      hoveredSnapZone: zone,
      activeSnapPreviewBounds: bounds,
    }),

  toggleShowDesktop: () =>
    set((state) => {
      const willShowDesktop = !state.showDesktop;
      if (willShowDesktop) {
        return {
          showDesktop: true,
          windows: state.windows.map((w) => ({ ...w, state: 'minimized', isFocused: false })),
          activeWindowId: null,
          focusedWindowId: null,
        };
      } else {
        const lastWin = state.windows.length > 0 ? state.windows[state.windows.length - 1].id : null;
        return {
          showDesktop: false,
          windows: state.windows.map((w) => ({
            ...w,
            state: 'normal',
            isFocused: w.id === lastWin,
          })),
          activeWindowId: lastWin,
          focusedWindowId: lastWin,
        };
      }
    }),

  setAltTabOpen: (open, index = 0) => set({ isAltTabOpen: open, altTabIndex: index }),

  cycleAltTab: (direction) =>
    set((state) => {
      const activeWindows = state.windows.filter((w) => w.state !== 'minimized');
      if (activeWindows.length === 0) return state;

      const total = activeWindows.length;
      const nextIndex =
        direction === 'next'
          ? (state.altTabIndex + 1) % total
          : (state.altTabIndex - 1 + total) % total;

      return { altTabIndex: nextIndex };
    }),
}));
