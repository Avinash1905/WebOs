import { create } from 'zustand';
import type { TaskbarState } from '../types/taskbar';

export const useTaskbarStore = create<TaskbarState>((set) => ({
  isStartMenuOpen: false,
  pinnedAppIds: ['pc', 'terminal', 'documents', 'settings'],
  activeTrayMenu: null,

  toggleStartMenu: (force) =>
    set((state) => ({
      isStartMenuOpen: force !== undefined ? force : !state.isStartMenuOpen,
      activeTrayMenu: null, // Close any open tray popovers
    })),

  setActiveTrayMenu: (menuId) =>
    set((state) => ({
      activeTrayMenu: state.activeTrayMenu === menuId ? null : menuId,
      isStartMenuOpen: false,
    })),

  pinApp: (appId) =>
    set((state) => ({
      pinnedAppIds: state.pinnedAppIds.includes(appId)
        ? state.pinnedAppIds
        : [...state.pinnedAppIds, appId],
    })),

  unpinApp: (appId) =>
    set((state) => ({
      pinnedAppIds: state.pinnedAppIds.filter((id) => id !== appId),
    })),
}));
