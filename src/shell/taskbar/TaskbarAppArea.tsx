import React from 'react';
import clsx from 'clsx';
import { useWindowStore } from '../../stores/windowStore';
import { useDesktopStore } from '../../stores/desktopStore';
import { Tooltip } from '../../ui/Tooltip/Tooltip';
import type { DesktopIconItem } from '../../types/desktop';

export interface TaskbarAppAreaProps {
  onOpenApp: (item: DesktopIconItem) => void;
  className?: string;
}

export const TaskbarAppArea: React.FC<TaskbarAppAreaProps> = ({ onOpenApp, className }) => {
  const { windows, focusedWindowId, toggleMinimize } = useWindowStore();
  const { icons } = useDesktopStore();

  const openWindows = windows;

  const handleAppClick = (windowId: string, appId: string) => {
    const existingWin = openWindows.find((w) => w.id === windowId || w.appId === appId);
    if (existingWin) {
      toggleMinimize(existingWin.id);
    } else {
      const matchedIcon = icons.find((i) => i.appId === appId);
      if (matchedIcon) {
        onOpenApp(matchedIcon);
      }
    }
  };

  const renderAppIcon = (icon: unknown) => {
    if (!icon) return null;
    if (React.isValidElement(icon)) return icon;
    const IconComp = icon as React.ElementType;
    return <IconComp size={20} />;
  };

  return (
    <div
      className={`os-taskbar-app-area ${className || ''}`}
      role="toolbar"
      aria-label="Running and Pinned Applications"
      data-testid="taskbar-app-area"
    >
      {openWindows.map((win) => {
        const isFocused = win.isFocused && win.id === focusedWindowId;
        const isMinimized = win.state === 'minimized';

        return (
          <Tooltip key={win.id} content={win.title} position="top">
            <button
              type="button"
              role="button"
              aria-label={win.title}
              aria-pressed={isFocused}
              data-testid={`taskbar-app-${win.appId}`}
              className={clsx(
                'os-taskbar-item',
                isFocused && 'os-taskbar-item--focused',
                isMinimized && 'os-taskbar-item--minimized'
              )}
              onClick={() => handleAppClick(win.id, win.appId)}
            >
              <div
                className="os-taskbar-item__icon"
                style={{ color: win.iconColor || 'inherit' }}
              >
                {renderAppIcon(win.icon)}
              </div>
              <span className="os-taskbar-item__title">{win.title}</span>
              <span className="os-taskbar-item__pill" />
            </button>
          </Tooltip>
        );
      })}
    </div>
  );
};
