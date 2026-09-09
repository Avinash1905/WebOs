import React, { useRef, useEffect } from 'react';
import { useStartMenuStore } from '../../stores/startMenuStore';
import { appRegistry, type AppDefinition } from '../../contracts/appRegistry';
import { StartMenuHeader } from './StartMenuHeader';
import { StartMenuSearch } from './StartMenuSearch';
import { StartMenuPinned } from './StartMenuPinned';
import { StartMenuAllApps } from './StartMenuAllApps';
import { StartMenuRecent } from './StartMenuRecent';
import { StartMenuFooter } from './StartMenuFooter';
import { Badge } from '../../ui/Badge/Badge';
import './startmenu.css';

export interface StartMenuProps {
  onOpenApp: (app: AppDefinition) => void;
}

export const StartMenu: React.FC<StartMenuProps> = ({ onOpenApp }) => {
  const {
    isOpen,
    viewMode,
    searchQuery,
    closeStartMenu,
    setViewMode,
  } = useStartMenuStore();

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        !(e.target as HTMLElement).closest('[data-testid="start-button"]')
      ) {
        closeStartMenu();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen, closeStartMenu]);

  if (!isOpen) return null;

  const allApps = appRegistry.getAllApplications();
  const pinnedApps = appRegistry.getPinnedApplications();
  const searchResults = searchQuery ? appRegistry.searchApplications(searchQuery) : [];

  const handleAppLaunch = (app: AppDefinition) => {
    onOpenApp(app);
    closeStartMenu();
  };

  const renderSearchResultIcon = (icon: unknown) => {
    if (!icon) return null;
    if (React.isValidElement(icon)) return icon;
    const IconComp = icon as React.ElementType;
    return <IconComp size={20} />;
  };

  return (
    <div
      ref={menuRef}
      className="os-start-menu"
      role="dialog"
      aria-label="Start Menu"
      data-testid="start-menu"
    >
      <StartMenuHeader
        onOpenSettings={() => {
          const settingsApp = allApps.find((a) => a.id === 'settings');
          if (settingsApp) handleAppLaunch(settingsApp);
        }}
      />

      <StartMenuSearch />

      <div className="os-start-menu__body">
        {searchQuery.trim() ? (
          <div className="os-start-menu__search-results">
            <div className="os-start-menu__section-header">
              <span className="os-start-menu__section-title">
                Search Results ({searchResults.length})
              </span>
            </div>
            {searchResults.length > 0 ? (
              <div className="os-start-menu__search-list">
                {searchResults.map((app) => (
                  <button
                    key={app.id}
                    type="button"
                    className="os-start-menu__search-item"
                    onClick={() => handleAppLaunch(app)}
                  >
                    <div
                      className="os-start-menu__search-item-icon"
                      style={{ color: app.iconColor || 'inherit' }}
                    >
                      {renderSearchResultIcon(app.icon)}
                    </div>
                    <div className="os-start-menu__search-item-info">
                      <span className="os-start-menu__search-item-name">{app.name}</span>
                      <span className="os-start-menu__search-item-desc">{app.description}</span>
                    </div>
                    <Badge size="sm" variant="primary">
                      {app.category}
                    </Badge>
                  </button>
                ))}
              </div>
            ) : (
              <div className="os-start-menu__empty-search">
                <p>No applications match &ldquo;{searchQuery}&rdquo;</p>
              </div>
            )}
          </div>
        ) : viewMode === 'pinned' ? (
          <>
            <StartMenuPinned
              apps={pinnedApps}
              onOpenApp={handleAppLaunch}
              onViewAllApps={() => setViewMode('all-apps')}
            />
            <StartMenuRecent />
          </>
        ) : (
          <StartMenuAllApps
            apps={allApps}
            onOpenApp={handleAppLaunch}
            onBack={() => setViewMode('pinned')}
          />
        )}
      </div>

      <StartMenuFooter
        onLock={closeStartMenu}
        onSignOut={closeStartMenu}
        onRestart={closeStartMenu}
        onShutdown={closeStartMenu}
      />
    </div>
  );
};
