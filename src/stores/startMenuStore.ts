import { create } from 'zustand';
import type { StartMenuState, StartMenuViewMode } from '../types/startmenu';

export const useStartMenuStore = create<StartMenuState>((set) => ({
  isOpen: false,
  viewMode: 'pinned',
  searchQuery: '',
  selectedCategory: null,
  selectedAppIndex: 0,

  openStartMenu: () => set({ isOpen: true, searchQuery: '', selectedAppIndex: 0 }),
  closeStartMenu: () => set({ isOpen: false, searchQuery: '' }),
  toggleStartMenu: () =>
    set((state) => ({
      isOpen: !state.isOpen,
      searchQuery: '',
      selectedAppIndex: 0,
    })),
  setViewMode: (viewMode: StartMenuViewMode) => set({ viewMode, selectedAppIndex: 0 }),
  setSearchQuery: (searchQuery: string) => set({ searchQuery, selectedAppIndex: 0 }),
  setSelectedCategory: (selectedCategory: string | null) =>
    set({ selectedCategory, selectedAppIndex: 0 }),
  setSelectedAppIndex: (selectedAppIndex: number) => set({ selectedAppIndex }),
}));
