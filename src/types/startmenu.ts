export type StartMenuViewMode = 'pinned' | 'all-apps';

export interface StartMenuState {
  isOpen: boolean;
  viewMode: StartMenuViewMode;
  searchQuery: string;
  selectedCategory: string | null;
  selectedAppIndex: number;
  openStartMenu: () => void;
  closeStartMenu: () => void;
  toggleStartMenu: () => void;
  setViewMode: (mode: StartMenuViewMode) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string | null) => void;
  setSelectedAppIndex: (index: number) => void;
}
