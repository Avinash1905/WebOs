import React from 'react';
import { User, Settings as SettingsIcon } from 'lucide-react';
import { IconButton } from '../../ui/IconButton/IconButton';
import { Badge } from '../../ui/Badge/Badge';

export interface StartMenuHeaderProps {
  onOpenSettings: () => void;
}

export const StartMenuHeader: React.FC<StartMenuHeaderProps> = ({ onOpenSettings }) => {
  return (
    <div className="os-start-menu__header">
      <div className="os-start-menu__user-profile">
        <div className="os-start-menu__avatar">
          <User size={20} />
        </div>
        <div className="os-start-menu__user-meta">
          <div className="os-start-menu__username">
            WebOS Explorer
            <Badge size="sm" variant="success" className="os-start-menu__user-badge">
              Active
            </Badge>
          </div>
          <span className="os-start-menu__user-role">Administrator</span>
        </div>
      </div>

      <div className="os-start-menu__header-actions">
        <IconButton
          icon={<SettingsIcon size={16} />}
          aria-label="Open Settings"
          size="sm"
          onClick={onOpenSettings}
        />
      </div>
    </div>
  );
};
