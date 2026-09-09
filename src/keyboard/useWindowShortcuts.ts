import { useEffect, useRef } from 'react';
import { useWindowStore } from '../stores/windowStore';
import { useStartMenuStore } from '../stores/startMenuStore';
import { useLauncherStore } from '../stores/launcherStore';
import { useDesktopStore } from '../stores/desktopStore';
import { useSearchStore } from '../stores/searchStore';
import { useQuickSettingsStore } from '../stores/quickSettingsStore';
import { useNotificationStore } from '../stores/notificationStore';
import { useOverlayStore } from '../stores/overlayStore';

export const useWindowShortcuts = () => {
  const isAltDownRef = useRef(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const {
        windows,
        focusedWindowId,
        closeWindow,
        minimizeWindow,
        maximizeWindow,
        restoreWindow,
        snapWindow,
        toggleShowDesktop,
        isAltTabOpen,
        setAltTabOpen,
        cycleAltTab,
      } = useWindowStore.getState();

      const { closeStartMenu, isOpen: isStartOpen } = useStartMenuStore.getState();
      const { closeLauncher, isOpen: isLauncherOpen } = useLauncherStore.getState();
      const { closeContextMenu } = useDesktopStore.getState();
      const { toggleSearch, isOpen: isSearchOpen, closeSearch } = useSearchStore.getState();
      const { toggleQuickSettings, isOpen: isQuickOpen, closeQuickSettings } = useQuickSettingsStore.getState();
      const { toggleNotificationCenter, isCenterOpen: isNotifOpen, closeNotificationCenter } = useNotificationStore.getState();
      const { dismissTopOverlay } = useOverlayStore.getState();

      // Hierarchical Escape dismissal
      if (e.key === 'Escape') {
        const handledByStack = dismissTopOverlay();
        if (!handledByStack) {
          if (isSearchOpen) closeSearch();
          else if (isQuickOpen) closeQuickSettings();
          else if (isNotifOpen) closeNotificationCenter();
          else if (isStartOpen) closeStartMenu();
          else if (isLauncherOpen) closeLauncher();
          else closeContextMenu();
        }
        if (isAltTabOpen) setAltTabOpen(false);
        return;
      }

      // Spotlight Global Search shortcut (Ctrl + Space or Win + S)
      if ((e.ctrlKey && e.code === 'Space') || ((e.metaKey || (e.altKey && !e.ctrlKey)) && (e.key === 's' || e.key === 'S'))) {
        e.preventDefault();
        toggleSearch();
        return;
      }

      // Quick Settings shortcut (Win + A or Ctrl + Shift + A)
      if ((e.metaKey && (e.key === 'a' || e.key === 'A')) || (e.ctrlKey && e.shiftKey && (e.key === 'a' || e.key === 'A'))) {
        e.preventDefault();
        toggleQuickSettings();
        return;
      }

      // Notification Center shortcut (Win + N or Ctrl + Shift + N)
      if ((e.metaKey && (e.key === 'n' || e.key === 'N')) || (e.ctrlKey && e.shiftKey && (e.key === 'n' || e.key === 'N'))) {
        e.preventDefault();
        toggleNotificationCenter();
        return;
      }

      // Track Alt key
      if (e.key === 'Alt') {
        isAltDownRef.current = true;
      }

      // Alt + Tab
      if (e.altKey && e.key === 'Tab') {
        e.preventDefault();
        const activeWindows = windows.filter((w) => w.state !== 'minimized');
        if (activeWindows.length > 0) {
          if (!isAltTabOpen) {
            setAltTabOpen(true, 0);
          } else {
            cycleAltTab(e.shiftKey ? 'prev' : 'next');
          }
        }
        return;
      }

      // Alt + F4: Close active window
      if (e.altKey && e.key === 'F4') {
        e.preventDefault();
        if (focusedWindowId) {
          closeWindow(focusedWindowId);
        }
        return;
      }

      // Win + D or Alt + D: Toggle Show Desktop
      if ((e.metaKey || (e.altKey && !e.ctrlKey)) && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        toggleShowDesktop();
        return;
      }

      // Directional shortcuts with Meta (Win) / Alt
      if (focusedWindowId && (e.metaKey || e.altKey)) {
        const activeWin = windows.find((w) => w.id === focusedWindowId);
        if (!activeWin) return;

        if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (activeWin.state === 'normal' || activeWin.state.startsWith('snapped-')) {
            maximizeWindow(focusedWindowId);
          }
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (activeWin.state === 'maximized') {
            restoreWindow(focusedWindowId);
          } else if (activeWin.state === 'normal') {
            minimizeWindow(focusedWindowId);
          }
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          snapWindow(focusedWindowId, 'left');
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          snapWindow(focusedWindowId, 'right');
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        isAltDownRef.current = false;
        const { isAltTabOpen, setAltTabOpen, focusWindow, altTabIndex, windows } =
          useWindowStore.getState();

        if (isAltTabOpen) {
          const activeWindows = windows.filter((w) => w.state !== 'minimized');
          if (activeWindows.length > 0 && activeWindows[altTabIndex]) {
            focusWindow(activeWindows[altTabIndex].id);
          }
          setAltTabOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
};
