import { useEffect, useRef } from 'react';
import { useWindowStore } from '../stores/windowStore';
import { shortcutEngine } from './shortcutEngine';

export const useWindowShortcuts = () => {
  const isAltDownRef = useRef(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const {
        windows,
        isAltTabOpen,
        setAltTabOpen,
        cycleAltTab,
      } = useWindowStore.getState();

      // Track Alt key
      if (e.key === 'Alt') {
        isAltDownRef.current = true;
      }

      // Alt + Tab Window Switcher
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

      // Let shortcut engine process all registered global & custom shortcuts
      const handled = shortcutEngine.handleKeyEvent(e);
      if (handled) {
        return;
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
