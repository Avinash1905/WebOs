import React from 'react';
import { RotateCw, Image, FolderPlus, Monitor, Palette } from 'lucide-react';
import type { DesktopIconItem } from '../../types/desktop';
import { DesktopGrid } from './DesktopGrid';
import { ContextMenu, type ContextMenuItem } from '../../ui/ContextMenu/ContextMenu';
import { useDesktopStore } from '../../stores/desktopStore';
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
    contextMenu,
    selectIcon,
    clearSelection,
    openContextMenu,
    closeContextMenu,
    rearrangeIcons,
  } = useDesktopStore();

  const { setWallpaper, currentWallpaper, desktopIconSize, setTheme, theme } = useUIStore();

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    openContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleSurfaceClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      clearSelection();
      closeContextMenu();
    }
  };

  const handleCycleWallpaper = () => {
    const currentIndex = WALLPAPERS.findIndex((w) => w.id === currentWallpaper.id);
    const nextIndex = (currentIndex + 1) % WALLPAPERS.length;
    setWallpaper(WALLPAPERS[nextIndex].id);
  };

  const contextMenuItems: (ContextMenuItem | 'separator')[] = [
    {
      id: 'refresh',
      label: 'Refresh Desktop',
      icon: <RotateCw size={15} />,
      shortcut: 'F5',
      onClick: () => {
        rearrangeIcons();
      },
    },
    'separator',
    {
      id: 'new-folder',
      label: 'New Folder',
      icon: <FolderPlus size={15} />,
      onClick: () => {
        // UI notification or trigger for Member 2 FS
      },
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
      onClick: () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
      },
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

  return (
    <div
      className="os-desktop-surface"
      data-testid="desktop-surface"
      onClick={handleSurfaceClick}
      onContextMenu={handleContextMenu}
    >
      <DesktopGrid
        icons={icons}
        selectedIconIds={selectedIconIds}
        focusedIconId={focusedIconId}
        size={desktopIconSize}
        onSelectIcon={selectIcon}
        onOpenIcon={onOpenApp}
      />

      {contextMenu?.isOpen && (
        <ContextMenu
          x={contextMenu.position.x}
          y={contextMenu.position.y}
          items={contextMenuItems}
          onClose={closeContextMenu}
        />
      )}
    </div>
  );
};
