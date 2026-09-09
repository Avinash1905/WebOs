import React from 'react';
import { ChevronRight } from 'lucide-react';
import type { AppDefinition } from '../../contracts/appRegistry';

export interface StartMenuPinnedProps {
  apps: AppDefinition[];
  onOpenApp: (app: AppDefinition) => void;
  onViewAllApps: () => void;
}

export const StartMenuPinned: React.FC<StartMenuPinnedProps> = ({
  apps,
  onOpenApp,
  onViewAllApps,
}) => {
  const renderIcon = (icon: unknown) => {
    if (!icon) return null;
    if (React.isValidElement(icon)) return icon;
    const IconComp = icon as React.ElementType;
    return <IconComp size={24} />;
  };

  return (
    <div className="os-start-menu__section">
      <div className="os-start-menu__section-header">
        <span className="os-start-menu__section-title">Pinned</span>
        <button
          type="button"
          className="os-start-menu__view-all-btn"
          onClick={onViewAllApps}
          data-testid="start-menu-all-apps-btn"
        >
          All Apps <ChevronRight size={14} />
        </button>
      </div>

      <div className="os-start-menu__pinned-grid">
        {apps.map((app) => (
          <button
            key={app.id}
            type="button"
            className="os-start-menu__pinned-item"
            data-testid={`start-app-${app.id}`}
            onClick={() => onOpenApp(app)}
          >
            <div
              className="os-start-menu__pinned-icon"
              style={{ color: app.iconColor || 'inherit' }}
            >
              {renderIcon(app.icon)}
            </div>
            <span className="os-start-menu__pinned-label">{app.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
