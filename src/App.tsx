import React, { useEffect, useCallback } from 'react';
import { DesktopShell } from './shell/desktop/DesktopShell';
import { Taskbar } from './shell/taskbar/Taskbar';
import { StartMenu } from './shell/startmenu/StartMenu';
import { AppLauncher } from './shell/launcher/AppLauncher';
import { WindowManager } from './wm/WindowManager';
import { NotificationToastContainer } from './notifications/NotificationToastContainer';
import { NotificationCenter } from './shell/notifications/NotificationCenter';
import { QuickSettingsPanel } from './shell/quicksettings/QuickSettingsPanel';
import { GlobalSearchOverlay } from './shell/search/GlobalSearchOverlay';
import { LiveAnnouncer } from './a11y/LiveAnnouncer';
import { ErrorBoundary } from './errors/ErrorBoundary';
import { useWindowStore } from './stores/windowStore';
import { useThemeStore } from './stores/themeStore';
import { useNotificationStore } from './stores/notificationStore';
import { useWindowShortcuts } from './keyboard/useWindowShortcuts';
import { useAuthStore } from './stores/authStore';
import { BootScreen } from './shell/auth/BootScreen';
import { LoginScreen } from './shell/auth/LoginScreen';
import { LockScreen } from './shell/auth/LockScreen';
import type { DesktopIconItem } from './types/desktop';
import { appRegistry, type AppDefinition } from './contracts/appRegistry';

export const App: React.FC = () => {
  const { openWindow } = useWindowStore();
  const currentTheme = useThemeStore((state) => state.currentTheme);
  const density = useThemeStore((state) => state.density);
  const addNotification = useNotificationStore((state) => state.addNotification);
  const { powerState } = useAuthStore();

  // Activate global keyboard shortcuts
  useWindowShortcuts();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme.mode);
    document.documentElement.setAttribute('data-density', density);

    // Initial welcoming window
    const pcApp = appRegistry.getApplication('pc');
    if (pcApp) {
      openWindow({
        id: 'win-welcome',
        appId: pcApp.id,
        title: 'This PC - System Overview',
        icon: pcApp.icon,
        iconColor: pcApp.iconColor,
        bounds: {
          x: 180,
          y: 80,
          width: 780,
          height: 500,
        },
      });
    }

    // Platform ready welcome notification
    const timer = setTimeout(() => {
      addNotification({
        title: 'WebOS Platform Ready',
        message: 'Themes, Drag-and-Drop, Accessibility, Shortcuts, and Full OS Suite active.',
        category: 'system',
        priority: 'normal',
        durationMs: 5000,
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [currentTheme.mode, density, openWindow, addNotification]);

  const handleOpenAppDef = useCallback(
    (app: AppDefinition) => {
      openWindow({
        id: `win-${app.id}-${Date.now()}`,
        appId: app.id,
        title: app.name,
        icon: app.icon,
        iconColor: app.iconColor,
        bounds: app.defaultBounds,
        minWidth: app.minWidth,
        minHeight: app.minHeight,
        maxWidth: app.maxWidth,
        maxHeight: app.maxHeight,
        canMaximize: app.canMaximize,
        canMinimize: app.canMinimize,
        canClose: app.canClose,
        canResize: app.canResize,
      });
    },
    [openWindow]
  );

  const handleOpenDesktopIcon = useCallback(
    (item: DesktopIconItem) => {
      const appDef = appRegistry.getApplication(item.appId);
      if (appDef) {
        handleOpenAppDef(appDef);
      } else {
        openWindow({
          id: `win-${item.appId}`,
          appId: item.appId,
          title: item.title,
          icon: item.icon,
          iconColor: item.iconColor,
        });
      }
    },
    [handleOpenAppDef, openWindow]
  );

  if (powerState === 'booting') {
    return <BootScreen />;
  }

  if (powerState === 'login') {
    return <LoginScreen />;
  }

  if (powerState === 'locked') {
    return <LockScreen />;
  }

  return (
    <ErrorBoundary fallbackTitle="Desktop Shell Recovery">
      <DesktopShell onOpenApp={handleOpenDesktopIcon}>
        {/* Complete Window Manager Subsystem */}
        <ErrorBoundary fallbackTitle="Window Manager Error">
          <WindowManager />
        </ErrorBoundary>

        {/* Start Menu Floating Layer */}
        <ErrorBoundary fallbackTitle="Start Menu Error">
          <StartMenu onOpenApp={handleOpenAppDef} />
        </ErrorBoundary>

        {/* Fullscreen Application Launchpad */}
        <ErrorBoundary fallbackTitle="Application Launcher Error">
          <AppLauncher onOpenApp={handleOpenAppDef} />
        </ErrorBoundary>

        {/* Taskbar */}
        <ErrorBoundary fallbackTitle="Taskbar Error">
          <Taskbar onOpenApp={handleOpenDesktopIcon} />
        </ErrorBoundary>

        {/* System UI Overlays */}
        <NotificationToastContainer />
        <NotificationCenter />
        <QuickSettingsPanel />
        <GlobalSearchOverlay />

        {/* Screen Reader ARIA Live Announcer */}
        <LiveAnnouncer />
      </DesktopShell>
    </ErrorBoundary>
  );
};

export default App;
