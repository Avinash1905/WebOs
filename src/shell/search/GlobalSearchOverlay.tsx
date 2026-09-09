import { useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useGlobalSearch } from '../../search/useGlobalSearch';
import { useOverlayStore } from '../../stores/overlayStore';
import { EmptyState } from '../../ui/EmptyState/EmptyState';
import { SearchResultItemComponent } from './SearchResultItemComponent';
import './searchOverlay.css';

const CATEGORIES = ['All', 'Applications', 'Settings', 'Commands', 'Recent'];

export const GlobalSearchOverlay = () => {
  const {
    isOpen,
    query,
    results,
    selectedIndex,
    selectedCategory,
    closeSearch,
    setQuery,
    setSelectedCategory,
    setSelectedIndex,
    executeSelected,
    handleKeyDown,
  } = useGlobalSearch();

  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const registerOverlay = useOverlayStore((state) => state.registerOverlay);

  // Overlay registration
  useEffect(() => {
    if (!isOpen) return;
    const unregister = registerOverlay({
      id: 'global-search',
      type: 'search',
      priority: 80, // High priority
      onDismiss: closeSearch,
    });
    return unregister;
  }, [isOpen, registerOverlay, closeSearch]);

  // Autofocus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="os-search-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          closeSearch();
        }
      }}
    >
      <div
        ref={modalRef}
        className="os-search-modal"
        role="dialog"
        aria-modal="true"
        aria-label="WebOS Spotlight Search"
        onKeyDown={handleKeyDown}
      >
        <div className="os-search-input-wrapper">
          <Search size={20} className="os-search-input-icon" />
          <input
            ref={inputRef}
            type="text"
            className="os-search-input"
            placeholder="Type a command or search WebOS..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              className="os-search-clear-btn"
              onClick={() => setQuery('')}
              title="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="os-search-categories">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`os-search-cat-btn ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="os-search-results-list" role="listbox">
          {results.length === 0 ? (
            <EmptyState
              icon={<Search size={32} />}
              title="No Results Found"
              description={`We couldn't find anything matching "${query}". Try another query.`}
            />
          ) : (
            results.map((item, index) => (
              <SearchResultItemComponent
                key={item.id}
                item={item}
                isSelected={index === selectedIndex}
                onSelect={() => setSelectedIndex(index)}
                onExecute={executeSelected}
              />
            ))
          )}
        </div>

        <div className="os-search-footer">
          <div className="os-search-footer-hints">
            <span>
              <span className="os-search-hint-key">↑↓</span> Navigate
            </span>
            <span>
              <span className="os-search-hint-key">↵</span> Open
            </span>
            <span>
              <span className="os-search-hint-key">ESC</span> Close
            </span>
          </div>
          <div>WebOS Spotlight</div>
        </div>
      </div>
    </div>
  );
};
