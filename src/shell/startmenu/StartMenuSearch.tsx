import React from 'react';
import { Search, X } from 'lucide-react';
import { useStartMenuStore } from '../../stores/startMenuStore';

export const StartMenuSearch: React.FC = () => {
  const { searchQuery, setSearchQuery } = useStartMenuStore();

  return (
    <div className="os-start-menu__search-container">
      <div className="os-start-menu__search-box">
        <Search size={16} className="os-start-menu__search-icon" />
        <input
          type="text"
          placeholder="Search apps, settings, and documents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          data-testid="start-menu-search-input"
          className="os-start-menu__search-input"
          autoFocus
        />
        {searchQuery && (
          <button
            type="button"
            aria-label="Clear Search"
            className="os-start-menu__search-clear"
            onClick={() => setSearchQuery('')}
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
};
