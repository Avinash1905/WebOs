import { Monitor, Folder, Trash2, Terminal, Settings } from 'lucide-react';
import type { DesktopIconItem } from '../../types/desktop';

export const DEFAULT_SYSTEM_ICONS: DesktopIconItem[] = [
  {
    id: 'icon-pc',
    appId: 'pc',
    title: 'This PC',
    icon: Monitor,
    iconColor: '#38bdf8',
    isSystem: true,
  },
  {
    id: 'icon-documents',
    appId: 'documents',
    title: 'Documents',
    icon: Folder,
    iconColor: '#fbbf24',
    isSystem: true,
  },
  {
    id: 'icon-terminal',
    appId: 'terminal',
    title: 'Terminal',
    icon: Terminal,
    iconColor: '#34d399',
    isSystem: true,
  },
  {
    id: 'icon-settings',
    appId: 'settings',
    title: 'Settings',
    icon: Settings,
    iconColor: '#a78bfa',
    isSystem: true,
  },
  {
    id: 'icon-recycle-bin',
    appId: 'recycle-bin',
    title: 'Recycle Bin',
    icon: Trash2,
    iconColor: '#94a3b8',
    isSystem: true,
  },
];
