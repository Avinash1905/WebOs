/**
 * member3Adapters.ts
 * Member 1 -> Member 3 Application SDK & Integration Boundary
 * 
 * Exposes a standardized application developer SDK allowing Member 3 applications
 * to run seamlessly inside the WebOS Window Manager without needing to implement
 * window dragging, resizing, z-indexing, minimization, themes, or shortcut infrastructure.
 */

import React from 'react';
import { useWindowStore } from '../stores/windowStore';
import { useThemeStore } from '../stores/themeStore';
import { useNotificationStore } from '../stores/notificationStore';

export interface AppWindowContext {
  windowId: string;
  appId: string;
  title: string;
  isFocused: boolean;
  isMaximized: boolean;
  isMinimized: boolean;
  bounds: { width: number; height: number };
  theme: 'dark' | 'light' | 'high-contrast' | 'custom';
  accentColor: string;
  close: () => void;
  minimize: () => void;
  maximize: () => void;
  restore: () => void;
  setTitle: (newTitle: string) => void;
  showNotification: (options: { title: string; message: string; type?: 'info' | 'success' | 'warning' | 'error' }) => void;
}

export interface WebOSAppManifest {
  id: string;
  name: string;
  version: string;
  category: 'productivity' | 'utilities' | 'system' | 'development' | 'media' | 'games';
  icon: string;
  description: string;
  author?: string;
  defaultWidth?: number;
  defaultHeight?: number;
  minWidth?: number;
  minHeight?: number;
  resizable?: boolean;
  singleton?: boolean;
  supportedFileExtensions?: string[];
  component: React.ComponentType<{ context: AppWindowContext }>;
}

/**
 * React Hook for Member 3 application components to easily consume their window container
 * and desktop integration APIs.
 */
export function useAppWindow(windowId: string, appId: string): AppWindowContext {
  const win = useWindowStore((state) => state.windows.find((w) => w.id === windowId));
  const activeWindowId = useWindowStore((state) => state.activeWindowId);
  const closeWindow = useWindowStore((state) => state.closeWindow);
  const minimizeWindow = useWindowStore((state) => state.minimizeWindow);
  const maximizeWindow = useWindowStore((state) => state.maximizeWindow);
  const restoreWindow = useWindowStore((state) => state.restoreWindow);
  const setWindowTitle = useWindowStore((state) => state.setWindowTitle);

  const theme = useThemeStore((state) => state.activePresetId);
  const accentColor = useThemeStore((state) => state.customAccentColor || state.currentTheme.colors.brand);
  const addNotification = useNotificationStore((state) => state.addNotification);

  return {
    windowId,
    appId,
    title: win?.title || 'Application',
    isFocused: activeWindowId === windowId,
    isMaximized: win?.state === 'maximized',
    isMinimized: win?.state === 'minimized',
    bounds: {
      width: win?.bounds.width || 640,
      height: win?.bounds.height || 480,
    },
    theme: theme as 'dark' | 'light' | 'high-contrast' | 'custom',
    accentColor,
    close: () => closeWindow(windowId),
    minimize: () => minimizeWindow(windowId),
    maximize: () => maximizeWindow(windowId),
    restore: () => restoreWindow(windowId),
    setTitle: (newTitle: string) => setWindowTitle(windowId, newTitle),
    showNotification: (options) => {
      addNotification({
        title: options.title,
        message: options.message,
        priority: 'normal',
        category: 'application',
        appId,
      });
    },
  };
}

/**
 * Standard Application Container component wrapping any Member 3 application
 * to provide uniform padding, theme inheritance, scroll management, and error isolation.
 */
export const AppContainer: React.FC<{
  children: React.ReactNode;
  padding?: string | number;
  className?: string;
}> = ({ children, padding = '16px', className = '' }) => {
  return React.createElement(
    'div',
    {
      className: `webos-app-container ${className}`,
      style: {
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        padding: typeof padding === 'number' ? `${padding}px` : padding,
        overflow: 'auto',
        color: 'var(--os-text-primary, #ffffff)',
        background: 'transparent',
      },
    },
    children
  );
};
