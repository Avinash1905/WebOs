import { create } from 'zustand';
import type { GlobalSearchState, SearchResultItem } from '../types/search';

const MAX_RECENT_QUERIES = 8;
const STORAGE_KEY = 'webos_recent_search_queries';

const loadRecentQueries = (): string[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // Fallback if localStorage is unavailable
  }
  return [];
};

const saveRecentQueries = (queries: string[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queries));
  } catch {
    // Ignore storage write error
  }
};

export const useSearchStore = create<GlobalSearchState>((set, get) => ({
  isOpen: false,
  query: '',
  results: [],
  selectedIndex: 0,
  selectedCategory: 'All',
  isLoading: false,
  recentQueries: loadRecentQueries(),

  openSearch: () => {
    set({ isOpen: true, query: '', selectedIndex: 0 });
  },

  closeSearch: () => {
    set({ isOpen: false, query: '', results: [], selectedIndex: 0 });
  },

  toggleSearch: () => {
    const { isOpen } = get();
    if (isOpen) {
      get().closeSearch();
    } else {
      get().openSearch();
    }
  },

  setQuery: (query: string) => {
    set({ query, selectedIndex: 0 });
  },

  setResults: (results: SearchResultItem[]) => {
    set({ results, selectedIndex: 0 });
  },

  setSelectedIndex: (selectedIndex: number) => {
    set({ selectedIndex });
  },

  setSelectedCategory: (selectedCategory: string) => {
    set({ selectedCategory, selectedIndex: 0 });
  },

  addRecentQuery: (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    const { recentQueries } = get();
    const filtered = recentQueries.filter((q) => q.toLowerCase() !== trimmed.toLowerCase());
    const next = [trimmed, ...filtered].slice(0, MAX_RECENT_QUERIES);
    saveRecentQueries(next);
    set({ recentQueries: next });
  },

  clearRecentQueries: () => {
    saveRecentQueries([]);
    set({ recentQueries: [] });
  },
}));
