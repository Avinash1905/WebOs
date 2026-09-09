import type { LucideIcon } from 'lucide-react';

export interface TaskbarAppItem {
  id: string;
  appId: string;
  title: string;
  icon: LucideIcon | string;
  iconColor?: string;
  isPinned: boolean;
  isOpen: boolean;
  isFocused: boolean;
  badge?: number | string;
}

export interface SystemTrayItem {
  id: string;
  label: string;
  icon: LucideIcon | string;
  statusText?: string;
  isActive?: boolean;
  onClick?: () => void;
}

export interface TaskbarState {
  isStartMenuOpen: boolean;
  pinnedAppIds: string[];
  activeTrayMenu: string | null;
  toggleStartMenu: (force?: boolean) => void;
  setActiveTrayMenu: (menuId: string | null) => void;
  pinApp: (appId: string) => void;
  unpinApp: (appId: string) => void;
}
