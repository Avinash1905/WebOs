import React from 'react';
import { Star } from 'lucide-react';
import type { AppDefinition } from '../../contracts/appRegistry';
import clsx from 'clsx';

export interface LauncherGridProps {
  apps: AppDefinition[];
  favoriteAppIds: string[];
  onOpenApp: (app: AppDefinition) => void;
  onToggleFavorite: (appId: string) => void;
}

export const LauncherGrid: React.FC<LauncherGridProps> = ({
  apps,
  favoriteAppIds,
  onOpenApp,
  onToggleFavorite,
}) => {
  const renderIcon = (icon: unknown) => {
    if (!icon) return null;
    if (React.isValidElement(icon)) return icon;
    const IconComp = icon as React.ElementType;
    return <IconComp size={36} />;
  };

  return (
    <div className="os-launcher__grid">
      {apps.map((app) => {
        const isFav = favoriteAppIds.includes(app.id);

        return (
          <div
            key={app.id}
            className="os-launcher__grid-card"
            data-testid={`launcher-card-${app.id}`}
            onClick={() => onOpenApp(app)}
          >
            <button
              type="button"
              aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
              className={clsx(
                'os-launcher__fav-btn',
                isFav && 'os-launcher__fav-btn--active'
              )}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(app.id);
              }}
            >
              <Star size={14} />
            </button>

            <div
              className="os-launcher__grid-icon"
              style={{ color: app.iconColor || 'inherit' }}
            >
              {renderIcon(app.icon)}
            </div>

            <span className="os-launcher__grid-title">{app.name}</span>
            <span className="os-launcher__grid-desc">{app.description}</span>
          </div>
        );
      })}
    </div>
  );
};
