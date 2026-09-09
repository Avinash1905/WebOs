import React from 'react';
import { Search, X, Rocket } from 'lucide-react';
import { useLauncherStore } from '../../stores/launcherStore';
import { appRegistry, type AppDefinition } from '../../contracts/appRegistry';
import { LauncherFilter } from './LauncherFilter';
import { LauncherGrid } from './LauncherGrid';
import { LauncherList } from './LauncherList';
import './launcher.css';

export interface AppLauncherProps {
  onOpenApp: (app: AppDefinition) => void;
}

export const AppLauncher: React.FC<AppLauncherProps> = ({ onOpenApp }) => {
  const {
    isOpen,
    viewMode,
    searchQuery,
    selectedCategory,
    favoriteAppIds,
    closeLauncher,
    setViewMode,
    setSearchQuery,
    setSelectedCategory,
    toggleFavorite,
  } = useLauncherStore();

  if (!isOpen) return null;

  const categories = ['All', 'Favorites', 'System', 'Productivity', 'Development', 'Utilities'];

  let displayedApps = searchQuery.trim()
    ? appRegistry.searchApplications(searchQuery)
    : appRegistry.getAllApplications();

  if (selectedCategory === 'Favorites') {
    displayedApps = displayedApps.filter((a) => favoriteAppIds.includes(a.id));
  } else if (selectedCategory !== 'All') {
    displayedApps = displayedApps.filter((a) => a.category === selectedCategory);
  }

  const handleAppLaunch = (app: AppDefinition) => {
    onOpenApp(app);
    closeLauncher();
  };

  return (
    <div
      className="os-launcher-backdrop"
      data-testid="app-launcher"
      role="dialog"
      aria-label="Application Launcher"
    >
      <div className="os-launcher-container">
        {/* Top bar */}
        <div className="os-launcher__top-bar">
          <div className="os-launcher__brand">
            <Rocket size={24} className="os-launcher__brand-icon" />
            <span className="os-launcher__brand-title">Launchpad</span>
          </div>

          <div className="os-launcher__search-box">
            <Search size={18} className="os-launcher__search-icon" />
            <input
              type="text"
              placeholder="Search applications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="os-launcher__search-input"
              data-testid="launcher-search-input"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                aria-label="Clear Search"
                className="os-launcher__search-clear"
                onClick={() => setSearchQuery('')}
              >
                <X size={16} />
              </button>
            )}
          </div>

          <button
            type="button"
            aria-label="Close Launcher"
            className="os-launcher__close-btn"
            data-testid="launcher-close-btn"
            onClick={closeLauncher}
          >
            <X size={20} />
          </button>
        </div>

        {/* Filter bar */}
        <LauncherFilter
          categories={categories}
          selectedCategory={selectedCategory}
          viewMode={viewMode}
          onSelectCategory={setSelectedCategory}
          onSelectViewMode={setViewMode}
        />

        {/* Content Area */}
        <div className="os-launcher__content">
          {displayedApps.length > 0 ? (
            viewMode === 'grid' ? (
              <LauncherGrid
                apps={displayedApps}
                favoriteAppIds={favoriteAppIds}
                onOpenApp={handleAppLaunch}
                onToggleFavorite={toggleFavorite}
              />
            ) : (
              <LauncherList
                apps={displayedApps}
                favoriteAppIds={favoriteAppIds}
                onOpenApp={handleAppLaunch}
                onToggleFavorite={toggleFavorite}
              />
            )
          ) : (
            <div className="os-launcher__empty">
              <p>No applications found for &ldquo;{searchQuery || selectedCategory}&rdquo;</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
