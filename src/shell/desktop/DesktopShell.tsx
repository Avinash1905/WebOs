import React, { useEffect } from 'react';
import { useDesktopStore } from '../../stores/desktopStore';
import { useUIStore } from '../../stores/uiStore';
import { DEFAULT_SYSTEM_ICONS } from './defaultIcons';
import { DesktopSurface } from './DesktopSurface';
import type { DesktopIconItem } from '../../types/desktop';
import './desktop.css';

export interface DesktopShellProps {
  children?: React.ReactNode;
  onOpenApp: (item: DesktopIconItem) => void;
}

export const DesktopShell: React.FC<DesktopShellProps> = ({ children, onOpenApp }) => {
  const { setIcons } = useDesktopStore();
  const { currentWallpaper } = useUIStore();

  useEffect(() => {
    setIcons(DEFAULT_SYSTEM_ICONS);
  }, [setIcons]);

  return (
    <div
      className="os-desktop-shell"
      style={{
        background: currentWallpaper.background,
      }}
      data-testid="desktop-shell"
    >
      {/* Dynamic Ambient Blur Glow Layer */}
      <div className="os-desktop-shell__ambient-mesh" />

      {/* Desktop Interaction Surface */}
      <DesktopSurface onOpenApp={onOpenApp} />

      {/* Foreground Container (Windows, Taskbar, Modals) */}
      <div className="os-desktop-shell__windows-layer">
        {children}
      </div>
    </div>
  );
};
