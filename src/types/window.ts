import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export type WindowStateMode =
  | 'normal'
  | 'minimized'
  | 'maximized'
  | 'fullscreen'
  | 'snapped-left'
  | 'snapped-right'
  | 'snapped-top'
  | 'snapped-bottom'
  | 'snapped-top-left'
  | 'snapped-top-right'
  | 'snapped-bottom-left'
  | 'snapped-bottom-right';

export type SnapZone =
  | 'none'
  | 'left'
  | 'right'
  | 'top'
  | 'bottom'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export type ResizeDirection =
  | 'n'
  | 's'
  | 'e'
  | 'w'
  | 'ne'
  | 'nw'
  | 'se'
  | 'sw';

export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WindowInstance {
  id: string;
  appId: string;
  title: string;
  icon?: LucideIcon | string | ReactNode;
  iconColor?: string;
  state: WindowStateMode;
  bounds: WindowBounds;
  previousBounds?: WindowBounds;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  isFocused: boolean;
  zIndex: number;
  content?: ReactNode;
  data?: any;
  canMinimize?: boolean;
  canMaximize?: boolean;
  canClose?: boolean;
  canResize?: boolean;
  canDrag?: boolean;
  isAlwaysOnTop?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface WindowOpenConfig {
  id: string;
  appId: string;
  title: string;
  icon?: LucideIcon | string | ReactNode;
  iconColor?: string;
  state?: WindowStateMode;
  bounds?: Partial<WindowBounds>;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  content?: ReactNode;
  data?: any;
  canMinimize?: boolean;
  canMaximize?: boolean;
  canClose?: boolean;
  canResize?: boolean;
  canDrag?: boolean;
  isAlwaysOnTop?: boolean;
}

export interface WindowManagerStore {
  windows: WindowInstance[];
  activeWindowId: string | null;
  focusedWindowId: string | null;
  hoveredSnapZone: SnapZone;
  activeSnapPreviewBounds: WindowBounds | null;
  isAltTabOpen: boolean;
  altTabIndex: number;
  showDesktop: boolean;

  openWindow: (config: WindowOpenConfig) => string;
  closeWindow: (id: string) => void;
  closeAllWindows: (appId?: string) => void;
  focusWindow: (id: string) => void;
  bringToFront: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  toggleMinimize: (id: string) => void;
  toggleMaximize: (id: string) => void;
  toggleFullscreen: (id: string) => void;
  snapWindow: (id: string, zone: SnapZone) => void;
  updateWindowBounds: (id: string, bounds: Partial<WindowBounds>) => void;
  setHoveredSnapZone: (zone: SnapZone, bounds: WindowBounds | null) => void;
  toggleShowDesktop: () => void;
  setAltTabOpen: (open: boolean, index?: number) => void;
  cycleAltTab: (direction: 'next' | 'prev') => void;
}
