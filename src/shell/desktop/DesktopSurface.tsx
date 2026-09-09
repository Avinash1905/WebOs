import React, { useRef } from 'react';
import {
  RotateCw,
  Image,
  FolderPlus,
  Monitor,
  Palette,
  Eye,
  ArrowUpDown,
  Grid,
} from 'lucide-react';
import type { DesktopIconItem } from '../../types/desktop';
import type { ContextMenuItemDef } from '../../types/contextMenu';
import { DesktopGrid } from './DesktopGrid';
import { DesktopSelection } from './DesktopSelection';
import { ContextMenuManager } from '../../contextmenu/ContextMenuManager';
import { useDesktopStore, type SelectionBox } from '../../stores/desktopStore';
import { useContextMenuStore } from '../../stores/contextMenuStore';
import { useThemeStore } from '../../stores/themeStore';
import { WALLPAPERS } from '../../theme/wallpapers';
import { useDroppable } from '../../dnd/useDroppable';

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
    snapToGrid,
    selectIcon,
    setSelectedIcons,
    clearSelection,
    setSelectionBox,
    sortIcons,
    toggleAutoArrange,
    setSnapToGrid,
    moveIcon,
    moveSelectedIcons,
    rearrangeIcons,
  } = useDesktopStore();

  const { wallpaper, setWallpaper, currentTheme, setThemeMode, density, setDensity } = useThemeStore();
  const openContextMenu = useContextMenuStore((state) => state.openContextMenu);

  const isDraggingSelectionRef = useRef(false);
  const dragStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Register droppable surface for desktop icons
  const { ref: droppableRef } = useDroppable({
    id: 'desktop-droppable-surface',
    type: 'desktop-surface',
    accepts: (dragItem) => dragItem.type === 'desktop-icon',
    onDrop: (dragItem, dropPos) => {
      const iconData = dragItem.data as DesktopIconItem;
      const gridCellSize = density === 'compact' ? 80 : density === 'spacious' ? 112 : 96;

      const targetCol = Math.max(0, Math.floor((dropPos.x - 16) / gridCellSize));
      const targetRow = Math.max(0, Math.floor((dropPos.y - 16) / gridCellSize));

      if (selectedIconIds.includes(iconData.id) && selectedIconIds.length > 1) {
        const deltaCols = targetCol - (iconData.gridCol ?? 0);
        const deltaRows = targetRow - (iconData.gridRow ?? 0);
        moveSelectedIcons(deltaCols, deltaRows);
      } else {
        moveIcon(iconData.id, targetCol, targetRow);
      }
    },
  });

  const handleCycleWallpaper = () => {
    const currentIndex = WALLPAPERS.findIndex((w) => w.id === wallpaper.id);
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
            id: 'density-spacious',
            label: 'Large / Spacious Icons',
            checked: density === 'spacious',
            onClick: () => setDensity('spacious'),
          },
          {
            id: 'density-comfortable',
            label: 'Medium / Normal Icons',
            checked: density === 'comfortable',
            onClick: () => setDensity('comfortable'),
          },
          {
            id: 'density-compact',
            label: 'Small / Compact Icons',
            checked: density === 'compact',
            onClick: () => setDensity('compact'),
          },
          'separator',
          {
            id: 'auto-arrange',
            label: 'Auto Arrange Icons',
            checked: autoArrange,
            onClick: toggleAutoArrange,
          },
          {
            id: 'snap-grid',
            label: 'Align Icons to Grid',
            checked: snapToGrid,
            icon: <Grid size={14} />,
            onClick: () => setSnapToGrid(!snapToGrid),
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
        label: `Switch Theme (${currentTheme.name})`,
        icon: <Palette size={15} />,
        onClick: () => setThemeMode(currentTheme.mode === 'dark' ? 'light' : 'dark'),
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
    isDraggingSelectionRef.current = true;
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    setSelectionBox({
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingSelectionRef.current) return;

    const currentBox: SelectionBox = {
      startX: dragStartPosRef.current.x,
      startY: dragStartPosRef.current.y,
      currentX: e.clientX,
      currentY: e.clientY,
    };
    setSelectionBox(currentBox);

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
        const id = el.getAttribute('data-icon-id') || el.getAttribute('data-testid')?.replace('desktop-icon-', 'icon-');
        if (id) selected.push(id);
      }
    });

    setSelectedIcons(selected);
  };

  const handleMouseUp = () => {
    if (isDraggingSelectionRef.current) {
      isDraggingSelectionRef.current = false;
      setSelectionBox(null);
    }
  };

  return (
    <div
      ref={droppableRef}
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
        size={density === 'compact' ? 'small' : density === 'spacious' ? 'large' : 'medium'}
        onSelectIcon={selectIcon}
        onOpenIcon={onOpenApp}
      />

      <DesktopSelection box={selectionBox} />
      <ContextMenuManager />
    </div>
  );
};
