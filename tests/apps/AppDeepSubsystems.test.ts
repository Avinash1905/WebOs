import { describe, expect, it } from 'vitest';
import {
  AppDependencyResolver,
  AppWindowManagerLayout,
  AppResourceQuota,
  AppManifestValidator,
} from '../../core/apps/index.js';

describe('Apps Deep Subsystems', () => {
  it('AppDependencyResolver resolves multi-package dependency trees', () => {
    const resolver = new AppDependencyResolver();

    resolver.registerPackage({
      name: 'app_editor',
      version: '1.0.0',
      dependencies: { lib_render: '^1.0.0' },
    });

    resolver.registerPackage({
      name: 'lib_render',
      version: '1.2.0',
      dependencies: { lib_math: '^2.0.0' },
    });

    resolver.registerPackage({
      name: 'lib_math',
      version: '2.1.0',
      dependencies: {},
    });

    const resolved = resolver.resolveDependencies('app_editor', '1.0.0');
    expect(resolved.get('app_editor')).toBe('1.0.0');
    expect(resolved.get('lib_render')).toBe('1.2.0');
    expect(resolved.get('lib_math')).toBe('2.1.0');
  });

  it('AppWindowManagerLayout computes Master-Stack and Grid window geometry', () => {
    const windows = ['w1', 'w2', 'w3'];

    const masterStack = AppWindowManagerLayout.computeMasterStackLayout(windows, 1920, 1080, 0.6);
    expect(masterStack.length).toBe(3);
    expect(masterStack[0]!.id).toBe('w1');
    expect(masterStack[0]!.width).toBe(1152); // 1920 * 0.6
    expect(masterStack[1]!.id).toBe('w2');
    expect(masterStack[1]!.x).toBe(1152);

    const grid = AppWindowManagerLayout.computeGrid(windows, 1920, 1080);
    expect(grid.length).toBe(3);
    expect(grid[0]!.width).toBeGreaterThan(0);
  });

  it('AppResourceQuota enforces open file handles and memory upper limits', () => {
    const quota = new AppResourceQuota();

    quota.setLimits('com.webos.calc', {
      maxMemoryBytes: 10 * 1024 * 1024,
      maxOpenFiles: 2,
      maxIPCChannels: 5,
    });

    expect(quota.trackOpenFile('com.webos.calc', '/data/f1.txt')).toBe(true);
    expect(quota.trackOpenFile('com.webos.calc', '/data/f2.txt')).toBe(true);
    expect(quota.trackOpenFile('com.webos.calc', '/data/f3.txt')).toBe(false); // exceeds maxOpenFiles (2)

    quota.trackCloseFile('com.webos.calc', '/data/f1.txt');
    expect(quota.trackOpenFile('com.webos.calc', '/data/f3.txt')).toBe(true); // now allowed

    expect(quota.trackMemory('com.webos.calc', 5 * 1024 * 1024)).toBe(true);
    expect(quota.trackMemory('com.webos.calc', 10 * 1024 * 1024)).toBe(false); // 5+10 = 15 > 10
  });

  it('AppManifestValidator validates manifest schema, semver format and ids', () => {
    const validManifest = {
      id: 'com.webos.texteditor',
      name: 'Text Editor',
      version: '1.0.0',
      entrypoint: 'index.js',
      permissions: ['fs:read', 'fs:write'],
    };

    const res = AppManifestValidator.validate(validManifest);
    expect(res.valid).toBe(true);
    expect(res.errors.length).toBe(0);

    const invalidManifest = {
      id: 'Invalid ID with spaces',
      name: '',
      version: 'invalid_version',
    };

    const badRes = AppManifestValidator.validate(invalidManifest);
    expect(badRes.valid).toBe(false);
    expect(badRes.errors.length).toBeGreaterThan(0);
  });
});
