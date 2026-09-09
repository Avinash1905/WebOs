import React, { useState } from 'react';
import clsx from 'clsx';
import { useWindowStore } from '../../stores/windowStore';
import { useTaskbarStore } from '../../stores/taskbarStore';
import { appRegistry } from '../../contracts/appRegistry';
import { Tooltip } from '../../ui/Tooltip/Tooltip';
import { Badge } from '../../ui/Badge/Badge';
import { TaskbarContextMenu } from './TaskbarContextMenu';
import type { TaskbarAppItem } from '../../types/taskbar';
import type { DesktopIconItem } from '../../types/desktop';

export interface TaskbarAppAreaProps {
  onOpenApp: (item: DesktopIconItem) => void;
  className?: string;
}

export const TaskbarAppArea: React.FC<TaskbarAppAreaProps> = ({ onOpenApp, className }) => {
  const { windows, focusedWindowId, toggleMinimize, focusWindow, restoreWindow } =
    useWindowStore();
  const { pinnedAppIds } = useTaskbarStore();

  const [contextMenuState, setContextMenuState] = useState<{
    x: number;
    y: number;
    item: TaskbarAppItem;
    instanceCount: number;
  } | null>(null);

  // Group windows by appId
  const windowGroups = windows.reduce<Record<string, typeof windows>>((acc, win) => {
    if (!acc[win.appId]) acc[win.appId] = [];
    acc[win.appId].push(win);
    return acc;
  }, {});

  // Collect unique list of app IDs (running + pinned)
  const allAppIds = Array.from(new Set([...pinnedAppIds, ...Object.keys(windowGroups)]));

  const handleAppClick = (appId: string) => {
    const runningInstances = windowGroups[appId] || [];

    if (runningInstances.length === 0) {
      // Launch pinned app
      const appDef = appRegistry.getApplication(appId);
      if (appDef) {
        onOpenApp({
          id: `icon-${appId}`,
          appId,
          title: appDef.name,
          icon: appDef.icon,
          iconColor: appDef.iconColor,
        });
      }
    } else if (runningInstances.length === 1) {
      toggleMinimize(runningInstances[0].id);
    } else {
      // Cycle through grouped windows
      const focusedIndex = runningInstances.findIndex((w) => w.id === focusedWindowId);
      const nextIndex = (focusedIndex + 1) % runningInstances.length;
      const target = runningInstances[nextIndex];
      if (target.state === 'minimized') {
        restoreWindow(target.id);
      }
      focusWindow(target.id);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, item: TaskbarAppItem, instanceCount: number) => {
    e.preventDefault();
    setContextMenuState({
      x: e.clientX,
      y: e.clientY,
      item,
      instanceCount,
    });
  };

  const renderIcon = (icon: unknown) => {
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
      {allAppIds.map((appId) => {
        const appDef = appRegistry.getApplication(appId);
        const instances = windowGroups[appId] || [];
        const isOpen = instances.length > 0;
        const isFocused = instances.some((w) => w.isFocused && w.id === focusedWindowId);
        const isAllMinimized = isOpen && instances.every((w) => w.state === 'minimized');
        const isPinned = pinnedAppIds.includes(appId);

        const title = appDef?.name || instances[0]?.title || appId;
        const icon = appDef?.icon || instances[0]?.icon;
        const iconColor = appDef?.iconColor || instances[0]?.iconColor;

        const taskbarItem: TaskbarAppItem = {
          id: `taskbar-${appId}`,
          appId,
          title,
          icon,
          iconColor,
          isPinned,
          isOpen,
          isFocused,
        };

        const tooltipContent = isOpen
          ? `${title} (${instances.length} open window${instances.length > 1 ? 's' : ''})`
          : `${title} (Pinned)`;

        return (
          <Tooltip key={appId} content={tooltipContent} position="top">
            <button
              type="button"
              role="button"
              aria-label={title}
              aria-pressed={isFocused}
              data-testid={`taskbar-app-${appId}`}
              className={clsx(
                'os-taskbar-item',
                isOpen && 'os-taskbar-item--open',
                isFocused && 'os-taskbar-item--focused',
                isAllMinimized && 'os-taskbar-item--minimized'
              )}
              onClick={() => handleAppClick(appId)}
              onContextMenu={(e) => handleContextMenu(e, taskbarItem, instances.length)}
            >
              <div
                className="os-taskbar-item__icon"
                style={{ color: iconColor || 'inherit' }}
              >
                {renderIcon(icon)}
              </div>

              <span className="os-taskbar-item__title">{title}</span>

              {instances.length > 1 && (
                <Badge size="sm" variant="primary" className="os-taskbar-item__group-badge">
                  {instances.length}
                </Badge>
              )}

              {isOpen && <span className="os-taskbar-item__pill" />}
            </button>
          </Tooltip>
        );
      })}

      {contextMenuState && (
        <TaskbarContextMenu
          x={contextMenuState.x}
          y={contextMenuState.y}
          item={contextMenuState.item}
          instanceCount={contextMenuState.instanceCount}
          onClose={() => setContextMenuState(null)}
          onOpenApp={(appId) => {
            const appDef = appRegistry.getApplication(appId);
            if (appDef) {
              onOpenApp({
                id: `icon-${appId}`,
                appId,
                title: appDef.name,
                icon: appDef.icon,
                iconColor: appDef.iconColor,
              });
            }
          }}
        />
      )}
    </div>
  );
};
