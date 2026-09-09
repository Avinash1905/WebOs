import {
  Minimize2,
  Maximize2,
  XCircle,
  BellOff,
  Terminal,
  RotateCw,
  LayoutGrid,
  Activity,
  Layers,
} from 'lucide-react';
import { useWindowStore } from '../../stores/windowStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { useLauncherStore } from '../../stores/launcherStore';
import type { ISearchProvider, SearchResultItem } from '../../types/search';

interface OSCommand {
  id: string;
  title: string;
  subtitle: string;
  keywords: string[];
  shortcut?: string;
  icon: typeof Minimize2;
  iconColor: string;
  action: () => void;
}

const OS_COMMANDS: OSCommand[] = [
  {
    id: 'cmd-minimize-all',
    title: 'Show Desktop (Minimize All Windows)',
    subtitle: 'Quickly minimize all open windows to taskbar',
    keywords: ['minimize', 'desktop', 'hide', 'windows', 'clear'],
    shortcut: 'Win + D',
    icon: Minimize2,
    iconColor: '#38bdf8',
    action: () => {
      useWindowStore.getState().toggleShowDesktop();
    },
  },
  {
    id: 'cmd-restore-all',
    title: 'Restore All Windows',
    subtitle: 'Bring all minimized windows back to screen',
    keywords: ['restore', 'show', 'unminimize', 'windows'],
    icon: Maximize2,
    iconColor: '#60a5fa',
    action: () => {
      const { windows, restoreWindow } = useWindowStore.getState();
      windows.forEach((w) => restoreWindow(w.id));
    },
  },
  {
    id: 'cmd-close-active',
    title: 'Close Active Window',
    subtitle: 'Terminate and close the currently focused window',
    keywords: ['close', 'quit', 'exit', 'kill'],
    shortcut: 'Alt + F4',
    icon: XCircle,
    iconColor: '#ef4444',
    action: () => {
      const { focusedWindowId, closeWindow } = useWindowStore.getState();
      if (focusedWindowId) {
        closeWindow(focusedWindowId);
      }
    },
  },
  {
    id: 'cmd-clear-notifs',
    title: 'Clear All Notifications',
    subtitle: 'Purge notification center badge and history',
    keywords: ['clear', 'notifications', 'alerts', 'dismiss'],
    icon: BellOff,
    iconColor: '#f59e0b',
    action: () => {
      useNotificationStore.getState().clearAll();
    },
  },
  {
    id: 'cmd-open-terminal',
    title: 'Open Terminal Shell',
    subtitle: 'Launch WebOS command line shell',
    keywords: ['terminal', 'bash', 'sh', 'cmd', 'command', 'cli'],
    shortcut: 'Ctrl + `',
    icon: Terminal,
    iconColor: '#34d399',
    action: () => {
      useWindowStore.getState().openWindow({
        id: 'win-terminal',
        appId: 'terminal',
        title: 'Terminal',
      });
    },
  },
  {
    id: 'cmd-open-launcher',
    title: 'Open Launchpad (App Launcher)',
    subtitle: 'Full-screen app catalog grid',
    keywords: ['launcher', 'apps', 'launchpad', 'programs'],
    icon: LayoutGrid,
    iconColor: '#a78bfa',
    action: () => {
      useLauncherStore.getState().openLauncher();
    },
  },
  {
    id: 'cmd-system-monitor',
    title: 'Open System Monitor (Task Manager)',
    subtitle: 'View active processes and telemetry',
    keywords: ['processes', 'cpu', 'memory', 'taskmgr', 'kill'],
    shortcut: 'Ctrl + Shift + Esc',
    icon: Activity,
    iconColor: '#f43f5e',
    action: () => {
      useWindowStore.getState().openWindow({
        id: 'win-monitor',
        appId: 'monitor',
        title: 'System Monitor',
      });
    },
  },
  {
    id: 'cmd-reload-os',
    title: 'Reload WebOS Environment',
    subtitle: 'Restart frontend shell and state',
    keywords: ['reload', 'restart', 'reboot', 'refresh'],
    icon: RotateCw,
    iconColor: '#eab308',
    action: () => {
      window.location.reload();
    },
  },
  {
    id: 'cmd-cascade-windows',
    title: 'Cascade All Windows',
    subtitle: 'Neatly offset all open windows diagonally',
    keywords: ['cascade', 'arrange', 'windows', 'tiles', 'neat'],
    icon: Layers,
    iconColor: '#818cf8',
    action: () => {
      const { windows, updateWindowBounds } = useWindowStore.getState();
      windows.forEach((w, idx) => {
        updateWindowBounds(w.id, {
          x: 40 + idx * 30,
          y: 40 + idx * 30,
        });
      });
    },
  },
];

export class CommandSearchProvider implements ISearchProvider {
  id = 'command-provider';
  name = 'Commands';
  category: 'Commands' = 'Commands';
  priority = 90;

  search(query: string): SearchResultItem[] {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const matches: SearchResultItem[] = [];

    for (const cmd of OS_COMMANDS) {
      let score = 0;
      const titleLower = cmd.title.toLowerCase();
      if (titleLower === q) {
        score = 95;
      } else if (titleLower.startsWith(q)) {
        score = 75;
      } else if (titleLower.includes(q)) {
        score = 55;
      } else if (cmd.keywords.some((k) => k.toLowerCase().includes(q))) {
        score = 50;
      } else if (cmd.subtitle.toLowerCase().includes(q)) {
        score = 30;
      }

      if (score > 0) {
        matches.push({
          id: cmd.id,
          title: cmd.title,
          subtitle: cmd.subtitle,
          category: 'Commands',
          icon: cmd.icon,
          iconColor: cmd.iconColor,
          score,
          keywords: cmd.keywords,
          shortcut: cmd.shortcut,
          action: cmd.action,
        });
      }
    }

    return matches.sort((a, b) => b.score - a.score);
  }
}
