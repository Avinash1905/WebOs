import type { ReactNode } from 'react';

export interface ContextMenuItemOption {
  id: string;
  label: string;
  icon?: ReactNode;
  shortcut?: string;
  danger?: boolean;
  disabled?: boolean;
  checked?: boolean;
  children?: (ContextMenuItemOption | 'separator')[];
  onClick?: () => void;
}

export type ContextMenuItemDef = ContextMenuItemOption | 'separator';

export interface ContextMenuRequest {
  id: string;
  x: number;
  y: number;
  items: ContextMenuItemDef[];
  targetId?: string;
}
