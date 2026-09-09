import React from 'react';
import type { DesktopIconItem } from '../../types/desktop';
import { DesktopIcon } from './DesktopIcon';

export interface DesktopGridProps {
  icons: DesktopIconItem[];
  selectedIconIds: string[];
  focusedIconId: string | null;
  size?: 'small' | 'medium' | 'large';
  onSelectIcon: (id: string, isMulti: boolean) => void;
  onOpenIcon: (item: DesktopIconItem) => void;
  onIconContextMenu?: (e: React.MouseEvent, item: DesktopIconItem) => void;
}

export const DesktopGrid: React.FC<DesktopGridProps> = ({
  icons,
  selectedIconIds,
  focusedIconId,
  size = 'medium',
  onSelectIcon,
  onOpenIcon,
  onIconContextMenu,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (icons.length === 0) return;

    const currentIndex = icons.findIndex((i) => i.id === focusedIconId);
    let nextIndex = currentIndex;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        nextIndex = currentIndex < icons.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'ArrowUp':
        e.preventDefault();
        nextIndex = currentIndex > 0 ? currentIndex - 1 : icons.length - 1;
        break;
      case 'Home':
        e.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        nextIndex = icons.length - 1;
        break;
      default:
        return;
    }

    if (nextIndex >= 0 && nextIndex < icons.length) {
      const nextIcon = icons[nextIndex];
      onSelectIcon(nextIcon.id, false);
      // Focus the icon element if available
      const element = document.querySelector(`[data-testid="desktop-icon-${nextIcon.appId}"]`) as HTMLElement;
      element?.focus();
    }
  };

  return (
    <div
      className="os-desktop-grid"
      role="grid"
      aria-label="Desktop Icons Grid"
      onKeyDown={handleKeyDown}
    >
      {icons.map((icon) => (
        <DesktopIcon
          key={icon.id}
          item={icon}
          isSelected={selectedIconIds.includes(icon.id)}
          isFocused={focusedIconId === icon.id}
          size={size}
          onSelect={onSelectIcon}
          onOpen={onOpenIcon}
          onContextMenu={onIconContextMenu}
        />
      ))}
    </div>
  );
};
