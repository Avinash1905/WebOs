import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { renderOSIcon } from '../../utils/iconUtils';

interface QuickSettingsTileProps {
  icon: LucideIcon | string | ReactNode;
  title: string;
  statusText?: string;
  isActive: boolean;
  onClick: () => void;
}

export const QuickSettingsTile = ({
  icon,
  title,
  statusText,
  isActive,
  onClick,
}: QuickSettingsTileProps) => {
  return (
    <div
      className={`os-qs-tile ${isActive ? 'active' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-pressed={isActive}
    >
      <div className="os-qs-tile-icon">{renderOSIcon(icon, { size: 18 })}</div>
      <div className="os-qs-tile-info">
        <span className="os-qs-tile-title">{title}</span>
        {statusText && <span className="os-qs-tile-status">{statusText}</span>}
      </div>
    </div>
  );
};
