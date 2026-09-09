import { create } from 'zustand';
import type { AppLauncherState, LauncherViewMode } from '../types/launcher';

export const useLauncherStore = create<AppLauncherState>((set) => ({
  isOpen: false,
  viewMode: 'grid',
  searchQuery: '',
  selectedCategory: 'All',
  favoriteAppIds: ['pc', 'documents', 'terminal', 'settings', 'editor'],

  openLauncher: () => set({ isOpen: true, searchQuery: '' }),
  closeLauncher: () => set({ isOpen: false, searchQuery: '' }),
  toggleLauncher: () =>
    set((state) => ({
      isOpen: !state.isOpen,
      searchQuery: '',
    })),
  setViewMode: (viewMode: LauncherViewMode) => set({ viewMode }),
  setSearchQuery: (searchQuery: string) => set({ searchQuery }),
  setSelectedCategory: (selectedCategory: string) => set({ selectedCategory }),
  toggleFavorite: (appId: string) =>
    set((state) => ({
      favoriteAppIds: state.favoriteAppIds.includes(appId)
        ? state.favoriteAppIds.filter((id) => id !== appId)
        : [...state.favoriteAppIds, appId],
    })),
}));
