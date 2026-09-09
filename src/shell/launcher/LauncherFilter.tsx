import React from 'react';
import { LayoutGrid, List } from 'lucide-react';
import type { LauncherViewMode } from '../../types/launcher';
import clsx from 'clsx';

export interface LauncherFilterProps {
  categories: string[];
  selectedCategory: string;
  viewMode: LauncherViewMode;
  onSelectCategory: (category: string) => void;
  onSelectViewMode: (mode: LauncherViewMode) => void;
}

export const LauncherFilter: React.FC<LauncherFilterProps> = ({
  categories,
  selectedCategory,
  viewMode,
  onSelectCategory,
  onSelectViewMode,
}) => {
  return (
    <div className="os-launcher__filter-bar">
      <div className="os-launcher__category-tabs">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            className={clsx(
              'os-launcher__category-tab',
              selectedCategory === cat && 'os-launcher__category-tab--active'
            )}
            onClick={() => onSelectCategory(cat)}
            data-testid={`launcher-cat-${cat}`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="os-launcher__view-toggle">
        <button
          type="button"
          aria-label="Grid View"
          className={clsx(
            'os-launcher__view-btn',
            viewMode === 'grid' && 'os-launcher__view-btn--active'
          )}
          onClick={() => onSelectViewMode('grid')}
        >
          <LayoutGrid size={16} />
        </button>
        <button
          type="button"
          aria-label="List View"
          className={clsx(
            'os-launcher__view-btn',
            viewMode === 'list' && 'os-launcher__view-btn--active'
          )}
          onClick={() => onSelectViewMode('list')}
        >
          <List size={16} />
        </button>
      </div>
    </div>
  );
};
