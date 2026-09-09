import React from 'react';
import { Star, Play } from 'lucide-react';
import type { AppDefinition } from '../../contracts/appRegistry';
import { Badge } from '../../ui/Badge/Badge';
import clsx from 'clsx';

export interface LauncherListProps {
  apps: AppDefinition[];
  favoriteAppIds: string[];
  onOpenApp: (app: AppDefinition) => void;
  onToggleFavorite: (appId: string) => void;
}

export const LauncherList: React.FC<LauncherListProps> = ({
  apps,
  favoriteAppIds,
  onOpenApp,
  onToggleFavorite,
}) => {
  const renderIcon = (icon: unknown) => {
    if (!icon) return null;
    if (React.isValidElement(icon)) return icon;
    const IconComp = icon as React.ElementType;
    return <IconComp size={22} />;
  };

  return (
    <div className="os-launcher__list">
      {apps.map((app) => {
        const isFav = favoriteAppIds.includes(app.id);

        return (
          <div
            key={app.id}
            className="os-launcher__list-row"
            data-testid={`launcher-row-${app.id}`}
            onClick={() => onOpenApp(app)}
          >
            <button
              type="button"
              aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
              className={clsx(
                'os-launcher__list-fav',
                isFav && 'os-launcher__list-fav--active'
              )}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(app.id);
              }}
            >
              <Star size={14} />
            </button>

            <div
              className="os-launcher__list-icon"
              style={{ color: app.iconColor || 'inherit' }}
            >
              {renderIcon(app.icon)}
            </div>

            <div className="os-launcher__list-details">
              <div className="os-launcher__list-name-row">
                <span className="os-launcher__list-name">{app.name}</span>
                <span className="os-launcher__list-version">v{app.version}</span>
              </div>
              <span className="os-launcher__list-desc">{app.description}</span>
            </div>

            <Badge size="sm" variant="secondary">
              {app.category}
            </Badge>

            <button
              type="button"
              className="os-launcher__launch-btn"
              onClick={(e) => {
                e.stopPropagation();
                onOpenApp(app);
              }}
            >
              <Play size={13} /> Launch
            </button>
          </div>
        );
      })}
    </div>
  );
};
