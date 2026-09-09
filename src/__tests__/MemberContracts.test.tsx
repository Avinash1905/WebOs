import { describe, it, expect } from 'vitest';
import { member2Bridge } from '../contracts/member2Adapters';
import { member4Bridge } from '../contracts/member4Adapters';

describe('Team Member Integration Contracts', () => {
  it('Member 2 OS Core Bridge provides process spawning and listing', async () => {
    const launchResult = await member2Bridge.spawnProcess({
      appId: 'terminal',
      args: { initialDir: '/home' },
    });

    expect(launchResult.success).toBe(true);
    expect(launchResult.pid).toBeGreaterThan(0);

    const processes = await member2Bridge.listProcesses();
    expect(processes.length).toBeGreaterThanOrEqual(2);
    expect(processes.some((p) => p.pid === launchResult.pid)).toBe(true);

    const killSuccess = await member2Bridge.killProcess(launchResult.pid);
    expect(killSuccess).toBe(true);
  });

  it('Member 2 OS Core Bridge provides virtual file system directory queries', async () => {
    const entries = await member2Bridge.listDirectory('/');
    expect(entries.length).toBeGreaterThan(0);
    expect(entries.some((e) => e.name === 'README.md')).toBe(true);
    expect(entries.some((e) => e.name === 'Documents')).toBe(true);
  });

  it('Member 4 Backend Bridge provides cloud settings persistence and user profile', async () => {
    const user = await member4Bridge.getCurrentUser();
    expect(user.id).toBeDefined();
    expect(user.username).toBe('developer');

    const saveSuccess = await member4Bridge.saveUserSettings({
      version: 1,
      updatedAt: Date.now(),
      theme: { activeThemeId: 'nord', density: 'comfortable' },
      shortcuts: { customBindings: {}, disabledShortcuts: [] },
      taskbar: { position: 'bottom', alignment: 'center', autoHide: false, showBadges: true },
      desktop: { iconPositions: {}, gridSnap: true, iconSize: 'medium' },
    });
    expect(saveSuccess).toBe(true);

    const loaded = await member4Bridge.loadUserSettings();
    expect(loaded).toBeDefined();
    expect(loaded?.theme.activeThemeId).toBe('nord');
  });
});
