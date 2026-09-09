import { create } from 'zustand';
import type { DesktopIconItem, DesktopContextMenuPosition } from '../types/desktop';

export type DesktopSortMode = 'name' | 'type' | 'date';
export type DesktopSortOrder = 'asc' | 'desc';

export interface SelectionBox {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

interface DesktopStore {
  icons: DesktopIconItem[];
  selectedIconIds: string[];
  focusedIconId: string | null;
  sortMode: DesktopSortMode;
  sortOrder: DesktopSortOrder;
  autoArrange: boolean;
  selectionBox: SelectionBox | null;
  contextMenu: {
    isOpen: boolean;
    position: DesktopContextMenuPosition;
  } | null;
  
  setIcons: (icons: DesktopIconItem[]) => void;
  selectIcon: (id: string, isMulti?: boolean) => void;
  setSelectedIcons: (ids: string[]) => void;
  clearSelection: () => void;
  setFocusedIcon: (id: string | null) => void;
  setSelectionBox: (box: SelectionBox | null) => void;
  sortIcons: (mode: DesktopSortMode, order?: DesktopSortOrder) => void;
  setAutoArrange: (autoArrange: boolean) => void;
  toggleAutoArrange: () => void;
  openContextMenu: (position: DesktopContextMenuPosition) => void;
  closeContextMenu: () => void;
  rearrangeIcons: () => void;
}

export const useDesktopStore = create<DesktopStore>((set, get) => ({
  icons: [],
  selectedIconIds: [],
  focusedIconId: null,
  sortMode: 'name',
  sortOrder: 'asc',
  autoArrange: true,
  selectionBox: null,
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

  setSelectedIcons: (selectedIconIds) => set({ selectedIconIds }),

  clearSelection: () => set({ selectedIconIds: [], focusedIconId: null, selectionBox: null }),

  setFocusedIcon: (id) => set({ focusedIconId: id }),

  setSelectionBox: (selectionBox) => set({ selectionBox }),

  sortIcons: (mode, order) => {
    const currentOrder = order || (get().sortMode === mode && get().sortOrder === 'asc' ? 'desc' : 'asc');
    const sorted = [...get().icons].sort((a, b) => {
      let comparison = 0;
      if (mode === 'name') {
        comparison = a.title.localeCompare(b.title);
      } else if (mode === 'type') {
        comparison = (a.appId || 'file').localeCompare(b.appId || 'file');
      } else if (mode === 'date') {
        comparison = a.id.localeCompare(b.id);
      }
      return currentOrder === 'asc' ? comparison : -comparison;
    });

    set({
      icons: sorted,
      sortMode: mode,
      sortOrder: currentOrder,
    });
  },

  setAutoArrange: (autoArrange) => set({ autoArrange }),

  toggleAutoArrange: () => set((state) => ({ autoArrange: !state.autoArrange })),

  openContextMenu: (position) => set({ contextMenu: { isOpen: true, position } }),

  closeContextMenu: () => set({ contextMenu: null }),

  rearrangeIcons: () =>
    set((state) => ({
      icons: [...state.icons],
    })),
}));
