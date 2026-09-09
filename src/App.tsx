import React, { useEffect, useCallback } from 'react';
import { DesktopShell } from './shell/desktop/DesktopShell';
import { Taskbar } from './shell/taskbar/Taskbar';
import { WindowContainer } from './shell/window/WindowContainer';
import { useWindowStore } from './stores/windowStore';
import { useUIStore } from './stores/uiStore';
import type { DesktopIconItem } from './types/desktop';
import { appRegistry } from './contracts/appRegistry';
import { DEFAULT_SYSTEM_ICONS } from './shell/desktop/defaultIcons';

export const App: React.FC = () => {
  const { windows, openWindow } = useWindowStore();
  const { theme } = useUIStore();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);

    // Register default system apps into the app registry for Member 3
    DEFAULT_SYSTEM_ICONS.forEach((icon) => {
      appRegistry.registerApplication({
        id: icon.appId,
        name: icon.title,
        category: 'System',
        icon: icon.icon,
        iconColor: icon.iconColor,
        version: '1.0.0',
        showOnDesktop: true,
        isPinnedToTaskbar: true,
      });
    });

    // Open initial welcoming window for demonstration
    openWindow({
      id: 'win-welcome',
      appId: 'pc',
      title: 'This PC - System Overview',
      icon: DEFAULT_SYSTEM_ICONS[0].icon,
      iconColor: DEFAULT_SYSTEM_ICONS[0].iconColor,
      bounds: {
        x: 180,
        y: 90,
        width: 720,
        height: 480,
      },
    });
  }, [theme, openWindow]);

  const handleOpenApp = useCallback(
    (item: DesktopIconItem) => {
      openWindow({
        id: `win-${item.appId}`,
        appId: item.appId,
        title: item.title,
        icon: item.icon,
        iconColor: item.iconColor,
      });
    },
    [openWindow]
  );

  return (
    <DesktopShell onOpenApp={handleOpenApp}>
      {/* Windows Manager Layer */}
      {windows.map((win) => (
        <WindowContainer key={win.id} window={win} />
      ))}

      {/* Taskbar */}
      <Taskbar onOpenApp={handleOpenApp} />
    </DesktopShell>
  );
};

export default App;
