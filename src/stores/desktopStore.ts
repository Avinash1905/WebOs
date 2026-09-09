import { create } from 'zustand';
import type { DesktopIconItem, DesktopContextMenuPosition } from '../types/desktop';
import { DEFAULT_SYSTEM_ICONS } from '../shell/desktop/defaultIcons';

export type DesktopSortMode = 'name' | 'type' | 'date';
export type DesktopSortOrder = 'asc' | 'desc';

export interface SelectionBox {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

const STORAGE_KEY = 'webos_desktop_positions';

const loadSavedPositions = (): Record<string, { col: number; row: number }> => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // fallback
  }
  return {};
};

const savePositions = (positions: Record<string, { col: number; row: number }>) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
  } catch {
    // ignore
  }
};

interface DesktopStore {
  icons: DesktopIconItem[];
  selectedIconIds: string[];
  focusedIconId: string | null;
  sortMode: DesktopSortMode;
  sortOrder: DesktopSortOrder;
  autoArrange: boolean;
  snapToGrid: boolean;
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
  setSnapToGrid: (snap: boolean) => void;
  moveIcon: (id: string, col: number, row: number) => void;
  moveSelectedIcons: (deltaCols: number, deltaRows: number) => void;
  openContextMenu: (position: DesktopContextMenuPosition) => void;
  closeContextMenu: () => void;
  rearrangeIcons: () => void;
}

const initialPositions = loadSavedPositions();
const initialIcons = DEFAULT_SYSTEM_ICONS.map((icon, idx) => {
  const pos = initialPositions[icon.id] || { col: 0, row: idx };
  return { ...icon, gridCol: pos.col, gridRow: pos.row };
});

export const useDesktopStore = create<DesktopStore>((set, get) => ({
  icons: initialIcons,
  selectedIconIds: [],
  focusedIconId: null,
  sortMode: 'name',
  sortOrder: 'asc',
  autoArrange: true,
  snapToGrid: true,
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

  setSnapToGrid: (snapToGrid) => set({ snapToGrid }),

  moveIcon: (id, col, row) => {
    const clampedCol = Math.max(0, col);
    const clampedRow = Math.max(0, row);
    const updated = get().icons.map((item) =>
      item.id === id ? { ...item, gridCol: clampedCol, gridRow: clampedRow } : item
    );
    set({ icons: updated, autoArrange: false });

    const positions: Record<string, { col: number; row: number }> = {};
    updated.forEach((i) => {
      positions[i.id] = { col: i.gridCol ?? 0, row: i.gridRow ?? 0 };
    });
    savePositions(positions);
  },

  moveSelectedIcons: (deltaCols, deltaRows) => {
    const { selectedIconIds, icons } = get();
    if (selectedIconIds.length === 0) return;

    const updated = icons.map((item) => {
      if (selectedIconIds.includes(item.id)) {
        const nextCol = Math.max(0, (item.gridCol ?? 0) + deltaCols);
        const nextRow = Math.max(0, (item.gridRow ?? 0) + deltaRows);
        return { ...item, gridCol: nextCol, gridRow: nextRow };
      }
      return item;
    });

    set({ icons: updated, autoArrange: false });

    const positions: Record<string, { col: number; row: number }> = {};
    updated.forEach((i) => {
      positions[i.id] = { col: i.gridCol ?? 0, row: i.gridRow ?? 0 };
    });
    savePositions(positions);
  },

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

    const arranged = sorted.map((icon, idx) => ({
      ...icon,
      gridCol: 0,
      gridRow: idx,
    }));

    set({
      icons: arranged,
      sortMode: mode,
      sortOrder: currentOrder,
      autoArrange: true,
    });
  },

  setAutoArrange: (autoArrange) => set({ autoArrange }),

  toggleAutoArrange: () => {
    const next = !get().autoArrange;
    if (next) {
      get().sortIcons(get().sortMode, get().sortOrder);
    } else {
      set({ autoArrange: false });
    }
  },

  openContextMenu: (position) => set({ contextMenu: { isOpen: true, position } }),

  closeContextMenu: () => set({ contextMenu: null }),

  rearrangeIcons: () => {
    get().sortIcons(get().sortMode, get().sortOrder);
  },
}));
