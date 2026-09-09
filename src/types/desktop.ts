import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface DesktopIconItem {
  id: string;
  appId: string;
  title: string;
  icon?: LucideIcon | string | ReactNode;
  iconColor?: string;
  gridRow?: number;
  gridCol?: number;
  badge?: number | string;
  isSystem?: boolean;
  action?: () => void;
}

export interface DesktopContextMenuPosition {
  x: number;
  y: number;
}

export interface DesktopState {
  icons: DesktopIconItem[];
  selectedIconIds: string[];
  focusedIconId: string | null;
  contextMenu: {
    isOpen: boolean;
    position: DesktopContextMenuPosition;
  } | null;
}
