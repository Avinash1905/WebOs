import React from 'react';
import { Play, Plus, Pin, PinOff, X, Layers } from 'lucide-react';
import { ContextMenu, type ContextMenuItem } from '../../ui/ContextMenu/ContextMenu';
import type { TaskbarAppItem } from '../../types/taskbar';
import { useTaskbarStore } from '../../stores/taskbarStore';
import { useWindowStore } from '../../stores/windowStore';

export interface TaskbarContextMenuProps {
  x: number;
  y: number;
  item: TaskbarAppItem;
  instanceCount: number;
  onClose: () => void;
  onOpenApp: (appId: string) => void;
}

export const TaskbarContextMenu: React.FC<TaskbarContextMenuProps> = ({
  x,
  y,
  item,
  instanceCount,
  onClose,
  onOpenApp,
}) => {
  const { pinApp, unpinApp } = useTaskbarStore();
  const { closeAllWindows } = useWindowStore();

  const menuItems: (ContextMenuItem | 'separator')[] = [
    {
      id: 'open',
      label: item.isOpen ? 'Switch to App' : 'Open',
      icon: <Play size={14} />,
      onClick: () => onOpenApp(item.appId),
    },
    {
      id: 'new-window',
      label: 'New Window',
      icon: <Plus size={14} />,
      onClick: () => onOpenApp(item.appId),
    },
    'separator',
    item.isPinned
      ? {
          id: 'unpin',
          label: 'Unpin from taskbar',
          icon: <PinOff size={14} />,
          onClick: () => unpinApp(item.appId),
        }
      : {
          id: 'pin',
          label: 'Pin to taskbar',
          icon: <Pin size={14} />,
          onClick: () => pinApp(item.appId),
        },
  ];

  if (item.isOpen) {
    menuItems.push('separator');
    if (instanceCount > 1) {
      menuItems.push({
        id: 'close-all',
        label: `Close All (${instanceCount})`,
        icon: <Layers size={14} />,
        danger: true,
        onClick: () => closeAllWindows(item.appId),
      });
    } else {
      menuItems.push({
        id: 'close',
        label: 'Close Window',
        icon: <X size={14} />,
        danger: true,
        onClick: () => closeAllWindows(item.appId),
      });
    }
  }

  return (
    <ContextMenu
      x={x}
      y={y - 180}
      items={menuItems}
      onClose={onClose}
    />
  );
};
