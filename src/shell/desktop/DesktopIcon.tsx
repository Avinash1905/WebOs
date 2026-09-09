import React, { useRef } from 'react';
import clsx from 'clsx';
import type { DesktopIconItem } from '../../types/desktop';
import { Badge } from '../../ui/Badge/Badge';

export interface DesktopIconProps {
  item: DesktopIconItem;
  isSelected: boolean;
  isFocused: boolean;
  size?: 'small' | 'medium' | 'large';
  onSelect: (id: string, isMulti: boolean) => void;
  onOpen: (item: DesktopIconItem) => void;
  onContextMenu?: (e: React.MouseEvent, item: DesktopIconItem) => void;
}

export const DesktopIcon: React.FC<DesktopIconProps> = ({
  item,
  isSelected,
  isFocused,
  size = 'medium',
  onSelect,
  onOpen,
  onContextMenu,
}) => {
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const isMulti = e.ctrlKey || e.metaKey || e.shiftKey;

    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
      onOpen(item);
    } else {
      onSelect(item.id, isMulti);
      clickTimeoutRef.current = setTimeout(() => {
        clickTimeoutRef.current = null;
      }, 300);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }
    onOpen(item);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpen(item);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(item.id, false);
    onContextMenu?.(e, item);
  };

  const renderIcon = () => {
    if (!item.icon) return null;
    if (React.isValidElement(item.icon)) return item.icon;
    const IconComp = item.icon as React.ElementType;
    return <IconComp className="os-desktop-icon__svg" size={24} />;
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={item.title}
      aria-selected={isSelected}
      data-testid={`desktop-icon-${item.appId}`}
      className={clsx(
        'os-desktop-icon',
        `os-desktop-icon--${size}`,
        isSelected && 'os-desktop-icon--selected',
        isFocused && 'os-desktop-icon--focused'
      )}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      onContextMenu={handleContextMenu}
    >
      <div className="os-desktop-icon__graphic-wrapper">
        <div
          className="os-desktop-icon__graphic"
          style={{ color: item.iconColor || 'var(--os-text-primary)' }}
        >
          {renderIcon()}
        </div>
        {item.badge !== undefined && (
          <Badge size="sm" variant="primary" className="os-desktop-icon__badge">
            {item.badge}
          </Badge>
        )}
      </div>

      <span className="os-desktop-icon__title" title={item.title}>
        {item.title}
      </span>
    </div>
  );
};
