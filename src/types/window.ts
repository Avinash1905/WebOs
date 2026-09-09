import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export type WindowStateMode = 'normal' | 'minimized' | 'maximized';

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
  icon?: LucideIcon | string;
  iconColor?: string;
  state: WindowStateMode;
  bounds: WindowBounds;
  minWidth?: number;
  minHeight?: number;
  isFocused: boolean;
  zIndex: number;
  content?: ReactNode;
  canMinimize?: boolean;
  canMaximize?: boolean;
  canClose?: boolean;
}

export interface WindowManagerStore {
  windows: WindowInstance[];
  activeWindowId: string | null;
  focusedWindowId: string | null;
  openWindow: (window: Omit<WindowInstance, 'isFocused' | 'zIndex'>) => void;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  toggleMinimize: (id: string) => void;
  updateWindowBounds: (id: string, bounds: Partial<WindowBounds>) => void;
}
