import { describe, it, expect } from 'vitest';
import { osCoreService } from '../contracts/osCore';
import { appRegistry } from '../contracts/appRegistry';
import { backendService } from '../contracts/backend';
import { Monitor } from 'lucide-react';

describe('Member Boundaries and Contracts', () => {
  it('validates Member 2 OS Core contract and mock adapter', async () => {
    const launchResult = await osCoreService.launchApplication('terminal');
    expect(launchResult.success).toBe(true);
    expect(launchResult.pid).toBeGreaterThan(0);

    const processes = await osCoreService.getRunningProcesses();
    expect(processes.length).toBeGreaterThan(0);
    expect(processes[0].name).toBe('WebOS Kernel');

    const fs = await osCoreService.getFileSystem();
    expect(fs.length).toBeGreaterThan(0);
  });

  it('validates Member 3 App Registry contract', () => {
    appRegistry.registerApplication({
      id: 'test-app',
      name: 'Test App',
      category: 'Utilities',
      icon: Monitor,
      version: '1.0.0',
      showOnDesktop: true,
      isPinnedToTaskbar: true,
    });

    const retrieved = appRegistry.getApplication('test-app');
    expect(retrieved).toBeDefined();
    expect(retrieved?.name).toBe('Test App');

    const desktopApps = appRegistry.getDesktopApplications();
    expect(desktopApps.some((a) => a.id === 'test-app')).toBe(true);
  });

  it('validates Member 4 Backend Sync contract and mock adapter', async () => {
    const profile = await backendService.getUserProfile();
    expect(profile.id).toBeDefined();
    expect(profile.username).toBe('WebOS Explorer');

    const notifications = await backendService.getNotifications();
    expect(notifications.length).toBeGreaterThan(0);
    expect(notifications[0].title).toBe('Welcome to WebOS');
  });
});
