import { useEffect, useCallback } from 'react';
import { useSearchStore } from '../stores/searchStore';
import { searchEngine } from './searchEngine';

export const useGlobalSearch = () => {
  const store = useSearchStore();

  const performSearch = useCallback(async (query: string, category: string) => {
    const results = await searchEngine.search(query, category);
    store.setResults(results);
  }, [store]);

  useEffect(() => {
    if (!store.isOpen) return;

    const timer = setTimeout(() => {
      performSearch(store.query, store.selectedCategory);
    }, 60);

    return () => clearTimeout(timer);
  }, [store.isOpen, store.query, store.selectedCategory, performSearch]);

  const executeSelected = useCallback(() => {
    const { results, selectedIndex, closeSearch, addRecentQuery, query } = useSearchStore.getState();
    if (results.length > 0 && selectedIndex >= 0 && selectedIndex < results.length) {
      const selected = results[selectedIndex];
      if (query.trim()) {
        addRecentQuery(query);
      }
      closeSearch();
      selected.action();
    }
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent | React.KeyboardEvent) => {
      const { results, selectedIndex, setSelectedIndex, closeSearch } = useSearchStore.getState();

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (results.length > 0) {
          setSelectedIndex((selectedIndex + 1) % results.length);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (results.length > 0) {
          setSelectedIndex((selectedIndex - 1 + results.length) % results.length);
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        executeSelected();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closeSearch();
      }
    },
    [executeSelected]
  );

  return {
    ...store,
    executeSelected,
    handleKeyDown,
  };
};
