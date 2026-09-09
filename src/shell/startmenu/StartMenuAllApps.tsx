import React from 'react';
import { ArrowLeft } from 'lucide-react';
import type { AppDefinition } from '../../contracts/appRegistry';
import { Badge } from '../../ui/Badge/Badge';

export interface StartMenuAllAppsProps {
  apps: AppDefinition[];
  onOpenApp: (app: AppDefinition) => void;
  onBack: () => void;
}

export const StartMenuAllApps: React.FC<StartMenuAllAppsProps> = ({
  apps,
  onOpenApp,
  onBack,
}) => {
  const renderIcon = (icon: unknown) => {
    if (!icon) return null;
    if (React.isValidElement(icon)) return icon;
    const IconComp = icon as React.ElementType;
    return <IconComp size={20} />;
  };

  // Group apps alphabetically
  const sortedApps = [...apps].sort((a, b) => a.name.localeCompare(b.name));
  const groups = sortedApps.reduce<Record<string, AppDefinition[]>>((acc, app) => {
    const letter = app.name[0].toUpperCase();
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(app);
    return acc;
  }, {});

  return (
    <div className="os-start-menu__all-apps-view">
      <div className="os-start-menu__all-apps-header">
        <button
          type="button"
          className="os-start-menu__back-btn"
          onClick={onBack}
          data-testid="start-menu-back-btn"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <span className="os-start-menu__section-title">All Applications</span>
      </div>

      <div className="os-start-menu__all-apps-list">
        {Object.entries(groups).map(([letter, groupApps]) => (
          <div key={letter} className="os-start-menu__app-group">
            <div className="os-start-menu__group-letter">{letter}</div>
            <div className="os-start-menu__group-items">
              {groupApps.map((app) => (
                <button
                  key={app.id}
                  type="button"
                  className="os-start-menu__list-item"
                  onClick={() => onOpenApp(app)}
                >
                  <div
                    className="os-start-menu__list-icon"
                    style={{ color: app.iconColor || 'inherit' }}
                  >
                    {renderIcon(app.icon)}
                  </div>
                  <div className="os-start-menu__list-info">
                    <span className="os-start-menu__list-name">{app.name}</span>
                    <span className="os-start-menu__list-desc">{app.description}</span>
                  </div>
                  <Badge size="sm" variant="secondary">
                    {app.category}
                  </Badge>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
