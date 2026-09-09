import { create } from 'zustand';
import type { DesktopIconItem, DesktopContextMenuPosition } from '../types/desktop';

interface DesktopStore {
  icons: DesktopIconItem[];
  selectedIconIds: string[];
  focusedIconId: string | null;
  contextMenu: {
    isOpen: boolean;
    position: DesktopContextMenuPosition;
  } | null;
  
  setIcons: (icons: DesktopIconItem[]) => void;
  selectIcon: (id: string, isMulti?: boolean) => void;
  clearSelection: () => void;
  setFocusedIcon: (id: string | null) => void;
  openContextMenu: (position: DesktopContextMenuPosition) => void;
  closeContextMenu: () => void;
  rearrangeIcons: () => void;
}

export const useDesktopStore = create<DesktopStore>((set) => ({
  icons: [],
  selectedIconIds: [],
  focusedIconId: null,
  contextMenu: null,

  setIcons: (icons) => set({ icons }),

  selectIcon: (id, isMulti = false) =>
    set((state) => ({
      selectedIconIds: isMulti
        ? state.selectedIconIds.includes(id)
          ? state.selectedIconIds.filter((i) => i !== id)
          : [...state.selectedIconIds, id]
        : [id],
      focusedIconId: id,
    })),

  clearSelection: () => set({ selectedIconIds: [], focusedIconId: null }),

  setFocusedIcon: (id) => set({ focusedIconId: id }),

  openContextMenu: (position) => set({ contextMenu: { isOpen: true, position } }),

  closeContextMenu: () => set({ contextMenu: null }),

  rearrangeIcons: () =>
    set((state) => ({
      // Clean refresh trigger
      icons: [...state.icons],
    })),
}));
