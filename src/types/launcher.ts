export type LauncherViewMode = 'grid' | 'list';

export interface AppLauncherState {
  isOpen: boolean;
  viewMode: LauncherViewMode;
  searchQuery: string;
  selectedCategory: string;
  favoriteAppIds: string[];
  openLauncher: () => void;
  closeLauncher: () => void;
  toggleLauncher: () => void;
  setViewMode: (mode: LauncherViewMode) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  toggleFavorite: (appId: string) => void;
}
