import React, { useEffect, useCallback } from 'react';
import { DesktopShell } from './shell/desktop/DesktopShell';
import { Taskbar } from './shell/taskbar/Taskbar';
import { StartMenu } from './shell/startmenu/StartMenu';
import { AppLauncher } from './shell/launcher/AppLauncher';
import { WindowManager } from './wm/WindowManager';
import { useWindowStore } from './stores/windowStore';
import { useUIStore } from './stores/uiStore';
import { useWindowShortcuts } from './keyboard/useWindowShortcuts';
import type { DesktopIconItem } from './types/desktop';
import { appRegistry, type AppDefinition } from './contracts/appRegistry';

export const App: React.FC = () => {
  const { openWindow } = useWindowStore();
  const { theme } = useUIStore();

  // Activate global keyboard shortcuts (Alt+Tab, Alt+F4, Win+D, Win+Arrows)
  useWindowShortcuts();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);

    // Initial welcoming window for demonstration
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
  }, [theme, openWindow]);

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

  return (
    <DesktopShell onOpenApp={handleOpenDesktopIcon}>
      {/* Complete Window Manager Subsystem */}
      <WindowManager />

      {/* Start Menu Floating Layer */}
      <StartMenu onOpenApp={handleOpenAppDef} />

      {/* Fullscreen Application Launchpad */}
      <AppLauncher onOpenApp={handleOpenAppDef} />

      {/* Taskbar */}
      <Taskbar onOpenApp={handleOpenDesktopIcon} />
    </DesktopShell>
  );
};

export default App;
