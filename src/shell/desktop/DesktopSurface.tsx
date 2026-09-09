import React, { useRef } from 'react';
import {
  RotateCw,
  Image,
  FolderPlus,
  Monitor,
  Palette,
  Eye,
  ArrowUpDown,
} from 'lucide-react';
import type { DesktopIconItem } from '../../types/desktop';
import type { ContextMenuItemDef } from '../../types/contextMenu';
import { DesktopGrid } from './DesktopGrid';
import { DesktopSelection } from './DesktopSelection';
import { ContextMenuManager } from '../../contextmenu/ContextMenuManager';
import { useDesktopStore, type SelectionBox } from '../../stores/desktopStore';
import { useContextMenuStore } from '../../stores/contextMenuStore';
import { useUIStore } from '../../stores/uiStore';
import { WALLPAPERS } from '../../theme/wallpapers';

export interface DesktopSurfaceProps {
  onOpenApp: (item: DesktopIconItem) => void;
}

export const DesktopSurface: React.FC<DesktopSurfaceProps> = ({ onOpenApp }) => {
  const {
    icons,
    selectedIconIds,
    focusedIconId,
    selectionBox,
    sortMode,
    sortOrder,
    autoArrange,
    selectIcon,
    setSelectedIcons,
    clearSelection,
    setSelectionBox,
    sortIcons,
    toggleAutoArrange,
    rearrangeIcons,
  } = useDesktopStore();

  const { setWallpaper, currentWallpaper, desktopIconSize, setDesktopIconSize, setTheme, theme } = useUIStore();
  const openContextMenu = useContextMenuStore((state) => state.openContextMenu);

  const isDraggingRef = useRef(false);
  const dragStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleCycleWallpaper = () => {
    const currentIndex = WALLPAPERS.findIndex((w) => w.id === currentWallpaper.id);
    const nextIndex = (currentIndex + 1) % WALLPAPERS.length;
    setWallpaper(WALLPAPERS[nextIndex].id);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();

    const menuItems: ContextMenuItemDef[] = [
      {
        id: 'view-options',
        label: 'View',
        icon: <Eye size={15} />,
        children: [
          {
            id: 'view-large',
            label: 'Large Icons',
            checked: desktopIconSize === 'large',
            onClick: () => setDesktopIconSize('large'),
          },
          {
            id: 'view-medium',
            label: 'Medium Icons',
            checked: desktopIconSize === 'medium',
            onClick: () => setDesktopIconSize('medium'),
          },
          {
            id: 'view-small',
            label: 'Small Icons',
            checked: desktopIconSize === 'small',
            onClick: () => setDesktopIconSize('small'),
          },
          'separator',
          {
            id: 'auto-arrange',
            label: 'Auto Arrange Icons',
            checked: autoArrange,
            onClick: toggleAutoArrange,
          },
        ],
      },
      {
        id: 'sort-options',
        label: 'Sort by',
        icon: <ArrowUpDown size={15} />,
        children: [
          {
            id: 'sort-name',
            label: 'Name',
            checked: sortMode === 'name',
            onClick: () => sortIcons('name'),
          },
          {
            id: 'sort-type',
            label: 'Item Type',
            checked: sortMode === 'type',
            onClick: () => sortIcons('type'),
          },
          {
            id: 'sort-date',
            label: 'Date Modified',
            checked: sortMode === 'date',
            onClick: () => sortIcons('date'),
          },
          'separator',
          {
            id: 'sort-asc',
            label: 'Ascending',
            checked: sortOrder === 'asc',
            onClick: () => sortIcons(sortMode, 'asc'),
          },
          {
            id: 'sort-desc',
            label: 'Descending',
            checked: sortOrder === 'desc',
            onClick: () => sortIcons(sortMode, 'desc'),
          },
        ],
      },
      {
        id: 'refresh',
        label: 'Refresh Desktop',
        icon: <RotateCw size={15} />,
        shortcut: 'F5',
        onClick: rearrangeIcons,
      },
      'separator',
      {
        id: 'new-folder',
        label: 'New Folder',
        icon: <FolderPlus size={15} />,
        onClick: () => {},
      },
      'separator',
      {
        id: 'next-wallpaper',
        label: 'Next Wallpaper',
        icon: <Image size={15} />,
        onClick: handleCycleWallpaper,
      },
      {
        id: 'toggle-theme',
        label: `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`,
        icon: <Palette size={15} />,
        onClick: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
      },
      'separator',
      {
        id: 'display-settings',
        label: 'Display Settings',
        icon: <Monitor size={15} />,
        onClick: () => {
          const settingsIcon = icons.find((i) => i.appId === 'settings');
          if (settingsIcon) onOpenApp(settingsIcon);
        },
      },
    ];

    openContextMenu({
      id: 'desktop-context-menu',
      x: e.clientX,
      y: e.clientY,
      items: menuItems,
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Left click only
    if (e.target !== e.currentTarget && !(e.target as HTMLElement).classList.contains('os-desktop-grid')) {
      return;
    }

    clearSelection();
    isDraggingRef.current = true;
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    setSelectionBox({
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;

    const currentBox: SelectionBox = {
      startX: dragStartPosRef.current.x,
      startY: dragStartPosRef.current.y,
      currentX: e.clientX,
      currentY: e.clientY,
    };
    setSelectionBox(currentBox);

    // Compute intersecting icons
    const left = Math.min(currentBox.startX, currentBox.currentX);
    const right = Math.max(currentBox.startX, currentBox.currentX);
    const top = Math.min(currentBox.startY, currentBox.currentY);
    const bottom = Math.max(currentBox.startY, currentBox.currentY);

    const iconElements = document.querySelectorAll<HTMLElement>('.os-desktop-icon');
    const selected: string[] = [];

    iconElements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const intersects =
        rect.left < right &&
        rect.right > left &&
        rect.top < bottom &&
        rect.bottom > top;

      if (intersects) {
        const id = el.getAttribute('data-icon-id');
        if (id) selected.push(id);
      }
    });

    setSelectedIcons(selected);
  };

  const handleMouseUp = () => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      setSelectionBox(null);
    }
  };

  return (
    <div
      className="os-desktop-surface"
      data-testid="desktop-surface"
      onContextMenu={handleContextMenu}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <DesktopGrid
        icons={icons}
        selectedIconIds={selectedIconIds}
        focusedIconId={focusedIconId}
        size={desktopIconSize}
        onSelectIcon={selectIcon}
        onOpenIcon={onOpenApp}
      />

      <DesktopSelection box={selectionBox} />
      <ContextMenuManager />
    </div>
  );
};
