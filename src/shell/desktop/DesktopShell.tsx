import React, { useEffect } from 'react';
import { useDesktopStore } from '../../stores/desktopStore';
import { useThemeStore } from '../../stores/themeStore';
import { DEFAULT_SYSTEM_ICONS } from './defaultIcons';
import { DesktopSurface } from './DesktopSurface';
import { DragPreviewLayer } from '../../dnd/DragPreviewLayer';
import type { DesktopIconItem } from '../../types/desktop';
import './desktop.css';

export interface DesktopShellProps {
  children?: React.ReactNode;
  onOpenApp: (item: DesktopIconItem) => void;
}

export const DesktopShell: React.FC<DesktopShellProps> = ({ children, onOpenApp }) => {
  const { setIcons } = useDesktopStore();
  const wallpaper = useThemeStore((state) => state.wallpaper);
  const wallpaperFit = useThemeStore((state) => state.wallpaperFit);
  const wallpaperBlur = useThemeStore((state) => state.wallpaperBlur);

  useEffect(() => {
    setIcons(DEFAULT_SYSTEM_ICONS);
  }, [setIcons]);

  const backgroundStyle: React.CSSProperties = {
    background: wallpaper.background.startsWith('http') || wallpaper.background.startsWith('/')
      ? `url("${wallpaper.background}")`
      : wallpaper.background,
    backgroundSize: wallpaperFit === 'cover' ? 'cover' : wallpaperFit === 'contain' ? 'contain' : wallpaperFit === 'tile' ? 'auto' : 'auto',
    backgroundRepeat: wallpaperFit === 'tile' ? 'repeat' : 'no-repeat',
    backgroundPosition: 'center',
    filter: wallpaperBlur > 0 ? `blur(${wallpaperBlur}px)` : undefined,
  };

  return (
    <div
      className="os-desktop-shell"
      style={backgroundStyle}
      data-testid="desktop-shell"
    >
      {/* Dynamic Ambient Blur Glow Layer */}
      <div className="os-desktop-shell__ambient-mesh" />

      {/* Desktop Interaction Surface */}
      <DesktopSurface onOpenApp={onOpenApp} />

      {/* Global Drag and Drop Visual Feedback Layer */}
      <DragPreviewLayer />

      {/* Foreground Container (Windows, Taskbar, Modals) */}
      <div className="os-desktop-shell__windows-layer">
        {children}
      </div>
    </div>
  );
};
