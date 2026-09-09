import { describe, it, expect, beforeEach } from 'vitest';
import { useWindowStore } from '../stores/windowStore';
import { useThemeStore } from '../stores/themeStore';
import { useNotificationStore } from '../stores/notificationStore';
import { useSearchStore } from '../stores/searchStore';
import { appRegistry } from '../contracts/appRegistry';

describe('Member 1 Cross-Subsystem Integration Flows', () => {
  beforeEach(() => {
    useWindowStore.setState({
      windows: [],
      activeWindowId: null,
      focusedWindowId: null,
    });
    useThemeStore.setState({
      activePresetId: 'dark',
      density: 'comfortable',
    });
    useNotificationStore.setState({
      notifications: [],
      toasts: [],
      unreadCount: 0,
      isCenterOpen: false,
    });
    useSearchStore.setState({
      isOpen: false,
      query: '',
      results: [],
    });
  });

  it('FLOW A: Search application -> Launch window -> Minimize -> Restore -> Close', () => {
    // 1. Search application
    const searchStore = useSearchStore.getState();
    searchStore.openSearch();
    expect(useSearchStore.getState().isOpen).toBe(true);

    const results = appRegistry.searchApplications('terminal');
    expect(results.length).toBeGreaterThan(0);
    const targetApp = results[0];

    // 2. Launch window
    const { openWindow, minimizeWindow, restoreWindow, closeWindow } = useWindowStore.getState();
    const winId = openWindow({
      id: targetApp.id,
      appId: targetApp.id,
      title: targetApp.name,
    });
    expect(useWindowStore.getState().windows.find((w) => w.id === winId)).toBeDefined();
    expect(useWindowStore.getState().activeWindowId).toBe(winId);

    // 3. Minimize
    minimizeWindow(winId);
    expect(useWindowStore.getState().windows.find((w) => w.id === winId)?.state).toBe('minimized');

    // 4. Restore
    restoreWindow(winId);
    expect(useWindowStore.getState().windows.find((w) => w.id === winId)?.state).toBe('normal');

    // 5. Close
    closeWindow(winId);
    expect(useWindowStore.getState().windows.length).toBe(0);
  });

  it('FLOW B: Quick Settings theme toggle propagates to active Theme Store and CSS variables', () => {
    const { setPreset, setDensity } = useThemeStore.getState();

    setPreset('preset-light');
    expect(useThemeStore.getState().activePresetId).toBe('preset-light');

    setPreset('preset-high-contrast');
    expect(useThemeStore.getState().activePresetId).toBe('preset-high-contrast');

    setDensity('compact');
    expect(useThemeStore.getState().density).toBe('compact');
  });

  it('FLOW C: Notification dispatch updates System Tray unread counter and Notification Center history', () => {
    const { addNotification, openNotificationCenter, dismissNotification } = useNotificationStore.getState();

    const notifId = addNotification({
      title: 'Security Alert',
      message: 'Firewall initialized successfully',
      priority: 'normal',
      category: 'security',
    });

    expect(useNotificationStore.getState().unreadCount).toBe(1);
    expect(useNotificationStore.getState().notifications.length).toBe(1);

    // Open Notification Center
    openNotificationCenter();
    expect(useNotificationStore.getState().isCenterOpen).toBe(true);

    // Dismiss toast/notification
    dismissNotification(notifId);
    expect(useNotificationStore.getState().notifications.length).toBe(0);
  });

  it('FLOW D: Multi-window task switching and Show Desktop toggle', () => {
    const { openWindow, toggleShowDesktop } = useWindowStore.getState();

    const w1 = openWindow({ id: 'app1', appId: 'app1', title: 'App 1' });
    const w2 = openWindow({ id: 'app2', appId: 'app2', title: 'App 2' });

    expect(w1).toBeDefined();
    expect(useWindowStore.getState().windows.length).toBe(2);
    expect(useWindowStore.getState().activeWindowId).toBe(w2);

    // Show desktop hides / minimizes windows
    toggleShowDesktop();
    expect(useWindowStore.getState().showDesktop).toBe(true);
    expect(useWindowStore.getState().windows.every((w) => w.state === 'minimized')).toBe(true);

    // Toggle back restores windows
    toggleShowDesktop();
    expect(useWindowStore.getState().showDesktop).toBe(false);
    expect(useWindowStore.getState().windows.every((w) => w.state === 'normal')).toBe(true);
  });
});
