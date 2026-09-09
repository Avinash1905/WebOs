import type { ShortcutDefinition } from './shortcutTypes';
import { useWindowStore } from '../stores/windowStore';
import { useStartMenuStore } from '../stores/startMenuStore';
import { useSearchStore } from '../stores/searchStore';
import { useQuickSettingsStore } from '../stores/quickSettingsStore';
import { useNotificationStore } from '../stores/notificationStore';
import { useLauncherStore } from '../stores/launcherStore';
import { useOverlayStore } from '../stores/overlayStore';
import { useThemeStore } from '../stores/themeStore';

export function createDefaultShortcuts(): ShortcutDefinition[] {
  return [
    {
      id: 'spotlight-search',
      name: 'Open Spotlight Search',
      description: 'Quick global search for apps, settings, and commands',
      category: 'System',
      defaultCombo: 'Ctrl+Space',
      currentCombo: 'Ctrl+Space',
      isEnabled: true,
      isCustomizable: true,
      action: () => useSearchStore.getState().toggleSearch(),
    },
    {
      id: 'toggle-start-menu',
      name: 'Toggle Start Menu',
      description: 'Open or close the system Start Menu',
      category: 'Navigation',
      defaultCombo: 'Meta',
      currentCombo: 'Meta',
      isEnabled: true,
      isCustomizable: true,
      action: () => useStartMenuStore.getState().toggleStartMenu(),
    },
    {
      id: 'quick-settings',
      name: 'Toggle Quick Settings',
      description: 'Flyout panel for Wi-Fi, Bluetooth, volume, and brightness',
      category: 'System',
      defaultCombo: 'Meta+A',
      currentCombo: 'Meta+A',
      isEnabled: true,
      isCustomizable: true,
      action: () => useQuickSettingsStore.getState().toggleQuickSettings(),
    },
    {
      id: 'notification-center',
      name: 'Toggle Notification Center',
      description: 'Open or close notification history sidebar',
      category: 'System',
      defaultCombo: 'Meta+N',
      currentCombo: 'Meta+N',
      isEnabled: true,
      isCustomizable: true,
      action: () => useNotificationStore.getState().toggleNotificationCenter(),
    },
    {
      id: 'show-desktop',
      name: 'Show Desktop',
      description: 'Minimize or restore all open application windows',
      category: 'Window Management',
      defaultCombo: 'Meta+D',
      currentCombo: 'Meta+D',
      isEnabled: true,
      isCustomizable: true,
      action: () => useWindowStore.getState().toggleShowDesktop(),
    },
    {
      id: 'file-explorer',
      name: 'Open File Explorer',
      description: 'Launch the file management workspace',
      category: 'Applications',
      defaultCombo: 'Meta+E',
      currentCombo: 'Meta+E',
      isEnabled: true,
      isCustomizable: true,
      action: () => {
        useWindowStore.getState().openWindow({
          id: 'win-documents',
          appId: 'documents',
          title: 'File Explorer',
        });
      },
    },
    {
      id: 'system-monitor',
      name: 'Open System Monitor',
      description: 'Launch Task Manager & performance telemetry',
      category: 'Applications',
      defaultCombo: 'Ctrl+Shift+Escape',
      currentCombo: 'Ctrl+Shift+Escape',
      isEnabled: true,
      isCustomizable: true,
      action: () => {
        useWindowStore.getState().openWindow({
          id: 'win-monitor',
          appId: 'monitor',
          title: 'System Monitor',
        });
      },
    },
    {
      id: 'close-window',
      name: 'Close Active Window',
      description: 'Terminate and close the currently focused window',
      category: 'Window Management',
      defaultCombo: 'Alt+F4',
      currentCombo: 'Alt+F4',
      isEnabled: true,
      isCustomizable: true,
      action: () => {
        const { focusedWindowId, closeWindow } = useWindowStore.getState();
        if (focusedWindowId) closeWindow(focusedWindowId);
      },
    },
    {
      id: 'snap-left',
      name: 'Snap Window Left',
      description: 'Snap focused window to the left half of the display',
      category: 'Window Management',
      defaultCombo: 'Meta+ArrowLeft',
      currentCombo: 'Meta+ArrowLeft',
      isEnabled: true,
      isCustomizable: true,
      action: () => {
        const { focusedWindowId, snapWindow } = useWindowStore.getState();
        if (focusedWindowId) snapWindow(focusedWindowId, 'left');
      },
    },
    {
      id: 'snap-right',
      name: 'Snap Window Right',
      description: 'Snap focused window to the right half of the display',
      category: 'Window Management',
      defaultCombo: 'Meta+ArrowRight',
      currentCombo: 'Meta+ArrowRight',
      isEnabled: true,
      isCustomizable: true,
      action: () => {
        const { focusedWindowId, snapWindow } = useWindowStore.getState();
        if (focusedWindowId) snapWindow(focusedWindowId, 'right');
      },
    },
    {
      id: 'maximize-window',
      name: 'Maximize Window',
      description: 'Maximize the currently focused window',
      category: 'Window Management',
      defaultCombo: 'Meta+ArrowUp',
      currentCombo: 'Meta+ArrowUp',
      isEnabled: true,
      isCustomizable: true,
      action: () => {
        const { focusedWindowId, maximizeWindow } = useWindowStore.getState();
        if (focusedWindowId) maximizeWindow(focusedWindowId);
      },
    },
    {
      id: 'minimize-window',
      name: 'Minimize Window',
      description: 'Minimize the currently focused window',
      category: 'Window Management',
      defaultCombo: 'Meta+ArrowDown',
      currentCombo: 'Meta+ArrowDown',
      isEnabled: true,
      isCustomizable: true,
      action: () => {
        const { focusedWindowId, minimizeWindow } = useWindowStore.getState();
        if (focusedWindowId) minimizeWindow(focusedWindowId);
      },
    },
    {
      id: 'toggle-launcher',
      name: 'Toggle Launchpad Grid',
      description: 'Fullscreen catalog of all registered applications',
      category: 'Navigation',
      defaultCombo: 'Ctrl+Shift+L',
      currentCombo: 'Ctrl+Shift+L',
      isEnabled: true,
      isCustomizable: true,
      action: () => useLauncherStore.getState().toggleLauncher(),
    },
    {
      id: 'toggle-high-contrast',
      name: 'Toggle High Contrast Theme',
      description: 'Switch between high contrast and normal mode',
      category: 'Accessibility',
      defaultCombo: 'Alt+Shift+H',
      currentCombo: 'Alt+Shift+H',
      isEnabled: true,
      isCustomizable: true,
      action: () => {
        const { currentTheme, setThemeMode } = useThemeStore.getState();
        setThemeMode(currentTheme.mode === 'high-contrast' ? 'dark' : 'high-contrast');
      },
    },
    {
      id: 'escape-hierarchy',
      name: 'Dismiss Top Overlay / Escape',
      description: 'Hierarchically dismiss open context menu, search, or dialog',
      category: 'Navigation',
      defaultCombo: 'Escape',
      currentCombo: 'Escape',
      isEnabled: true,
      isCustomizable: false,
      action: () => {
        useOverlayStore.getState().dismissTopOverlay();
      },
    },
  ];
}
