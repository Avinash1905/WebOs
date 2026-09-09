import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export type SearchResultCategory =
  | 'Applications'
  | 'Settings'
  | 'Commands'
  | 'Files'
  | 'Recent';

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle?: string;
  category: SearchResultCategory;
  icon?: LucideIcon | string | ReactNode;
  iconColor?: string;
  score: number;
  keywords?: string[];
  shortcut?: string;
  action: () => void;
}

export interface ISearchProvider {
  id: string;
  name: string;
  category: SearchResultCategory;
  priority: number;
  search: (query: string) => Promise<SearchResultItem[]> | SearchResultItem[];
}

export interface GlobalSearchState {
  isOpen: boolean;
  query: string;
  results: SearchResultItem[];
  selectedIndex: number;
  selectedCategory: string;
  isLoading: boolean;
  recentQueries: string[];

  openSearch: () => void;
  closeSearch: () => void;
  toggleSearch: () => void;
  setQuery: (query: string) => void;
  setResults: (results: SearchResultItem[]) => void;
  setSelectedIndex: (index: number) => void;
  setSelectedCategory: (cat: string) => void;
  addRecentQuery: (query: string) => void;
  clearRecentQueries: () => void;
}
