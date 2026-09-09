import { create } from 'zustand';
import type { ContextMenuRequest } from '../types/contextMenu';

interface ContextMenuStoreState {
  activeMenu: ContextMenuRequest | null;
  openContextMenu: (request: ContextMenuRequest) => void;
  closeContextMenu: () => void;
}

export const useContextMenuStore = create<ContextMenuStoreState>((set) => ({
  activeMenu: null,
  openContextMenu: (request) => set({ activeMenu: request }),
  closeContextMenu: () => set({ activeMenu: null }),
}));
