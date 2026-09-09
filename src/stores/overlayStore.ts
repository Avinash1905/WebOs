import { create } from 'zustand';
import type { OverlayStoreState, OverlayInstance } from '../types/overlay';

export const useOverlayStore = create<OverlayStoreState>((set, get) => ({
  activeOverlays: [],

  registerOverlay: (overlay: OverlayInstance) => {
    set((state) => {
      // Remove any existing overlay with same ID
      const filtered = state.activeOverlays.filter((o) => o.id !== overlay.id);
      // Insert in descending order of priority (highest priority first)
      const updated = [...filtered, overlay].sort((a, b) => b.priority - a.priority);
      return { activeOverlays: updated };
    });

    // Return unregister function
    return () => {
      set((state) => ({
        activeOverlays: state.activeOverlays.filter((o) => o.id !== overlay.id),
      }));
    };
  },

  dismissTopOverlay: () => {
    const { activeOverlays } = get();
    if (activeOverlays.length === 0) return false;

    // Highest priority overlay is first
    const [top, ...rest] = activeOverlays;
    set({ activeOverlays: rest });
    try {
      top.onDismiss();
    } catch {
      // Ignore dismiss error
    }
    return true;
  },

  dismissAllOverlays: () => {
    const { activeOverlays } = get();
    set({ activeOverlays: [] });
    activeOverlays.forEach((o) => {
      try {
        o.onDismiss();
      } catch {
        // ignore
      }
    });
  },
}));
