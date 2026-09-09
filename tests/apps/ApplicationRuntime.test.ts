import { describe, it, expect, beforeEach } from 'vitest';
import { ApplicationRuntime } from '../../core/apps/ApplicationRuntime.js';
import { EventBus } from '../../core/events/EventBus.js';
import { StorageEngine } from '../../core/storage/StorageEngine.js';
import { FileSystem } from '../../core/filesystem/FileSystem.js';
import { UserManager, USER_ROLES } from '../../core/users/index.js';
import { PermissionManager } from '../../core/permissions/PermissionManager.js';
import { ProcessManager } from '../../core/process/ProcessManager.js';
import { ClipboardManager } from '../../core/clipboard/ClipboardManager.js';
import {
  AppAlreadyRegisteredError,
  AppAlreadyRunningError,
  InvalidManifestError,
} from '../../core/apps/ApplicationError.js';

describe('ApplicationRuntime', () => {
  let eventBus: EventBus;
  let storage: StorageEngine;
  let userManager: UserManager;
  let permissionManager: PermissionManager;
  let fs: FileSystem;
  let processManager: ProcessManager;
  let clipboard: ClipboardManager;
  let appRuntime: ApplicationRuntime;

  beforeEach(async () => {
    eventBus = new EventBus();
    storage = new StorageEngine({ adapter: 'memory' });
    await storage.initialize();
    await storage.start();

    userManager = new UserManager({ eventBus, storage });
    permissionManager = new PermissionManager({ eventBus, storage, userManager });
    fs = new FileSystem({ eventBus, storage, permissionManager, userManager });
    userManager.attachFileSystem(fs);

    await fs.initialize();
    await fs.start();
    await userManager.initialize();
    await userManager.start();
    await permissionManager.initialize();
    await permissionManager.start();

    processManager = new ProcessManager({ eventBus, userManager, permissionManager, fileSystem: fs });
    await processManager.initialize();
    await processManager.start();

    clipboard = new ClipboardManager({ eventBus, fileSystem: fs, storage, permissionManager });
    await clipboard.initialize();
    await clipboard.start();

    appRuntime = new ApplicationRuntime({
      eventBus,
      storage,
      filesystem: fs,
      userManager,
      permissionManager,
      processManager,
      clipboardManager: clipboard,
    });
    await appRuntime.initialize();
    await appRuntime.start();
  });

  it('should pre-register built-in applications', () => {
    const apps = appRuntime.getApps();
    expect(apps.length).toBeGreaterThanOrEqual(6);

    expect(appRuntime.hasApp('com.webos.notepad')).toBe(true);
    expect(appRuntime.hasApp('com.webos.files')).toBe(true);
    expect(appRuntime.hasApp('com.webos.terminal')).toBe(true);
    expect(appRuntime.hasApp('com.webos.taskmgr')).toBe(true);
    expect(appRuntime.hasApp('com.webos.settings')).toBe(true);
    expect(appRuntime.hasApp('com.webos.calculator')).toBe(true);
  });

  it('should register custom application manifest and prevent duplicate ID', () => {
    const manifest = appRuntime.registerApp({
      id: 'com.example.editor',
      name: 'Custom Editor',
      version: '1.0.0',
      category: 'Productivity',
      multiInstance: true,
      permissions: ['filesystem:read', 'filesystem:write', 'clipboard:read'],
    });

    expect(manifest.id).toBe('com.example.editor');
    expect(appRuntime.hasApp('com.example.editor')).toBe(true);

    expect(() =>
      appRuntime.registerApp({
        id: 'com.example.editor',
        name: 'Duplicate',
        version: '1.0.0',
      })
    ).toThrow(AppAlreadyRegisteredError);
  });

  it('should validate manifests and reject invalid ones', () => {
    expect(() =>
      appRuntime.registerApp({
        id: '',
        name: 'Bad App',
        version: '1.0.0',
      } as any)
    ).toThrow(InvalidManifestError);

    expect(() =>
      appRuntime.registerApp({
        id: 'bad@id!',
        name: 'Bad App',
        version: '1.0.0',
      } as any)
    ).toThrow(InvalidManifestError);
  });

  it('should filter registered applications by category and file extension', () => {
    const textApps = appRuntime.getApps({ fileExtension: '.txt' });
    expect(textApps.some((a) => a.id === 'com.webos.notepad')).toBe(true);

    const sysApps = appRuntime.getApps({ category: 'System' });
    expect(sysApps.some((a) => a.id === 'com.webos.terminal')).toBe(true);
  });

  it('should launch an application, create process, and provide isolated context', async () => {
    const user = await userManager.createUser({
      username: 'testuser',
      role: USER_ROLES.USER,
      provisionHomeDirectory: true,
    });
    await userManager.switchUser(user.id);

    let mainExecuted = false;
    let contextVerified = false;

    appRuntime.registerApp({
      id: 'com.test.runner',
      name: 'Test App',
      version: '1.0.0',
      multiInstance: true,
      permissions: ['filesystem:read', 'filesystem:write', 'clipboard:read', 'clipboard:write'],
      main: async (context) => {
        mainExecuted = true;
        expect(context.appId).toBe('com.test.runner');
        expect(context.instanceId).toBeDefined();
        expect(context.processId).toBeGreaterThan(0);

        // App-scoped storage
        await context.storage.set('pref_key', 'pref_val');
        const readVal = await context.storage.get('pref_key');
        expect(readVal).toBe('pref_val');

        // Scoped VFS (write to user's Documents directory)
        await context.fs.writeFile('/home/testuser/Documents/app_out.txt', 'From Test App');
        const fileContent = await context.fs.readFile('/home/testuser/Documents/app_out.txt');
        expect(fileContent).toBe('From Test App');

        // Scoped Clipboard
        await context.clipboard.writeText('App Clipboard');
        const clipText = await context.clipboard.readText();
        expect(clipText).toBe('App Clipboard');

        contextVerified = true;

        return () => {
          // cleanup callback
        };
      },
    });

    const instance = await appRuntime.launch('com.test.runner', {
      userId: user.id,
      args: { initialFile: 'foo.txt' },
    });

    expect(instance.instanceId).toBeDefined();
    expect(instance.state).toBe('running');
    expect(mainExecuted).toBe(true);
    expect(contextVerified).toBe(true);
    expect(appRuntime.isAppRunning('com.test.runner')).toBe(true);

    await appRuntime.terminate(instance.instanceId);
    expect(appRuntime.isAppRunning('com.test.runner')).toBe(false);
  });

  it('should enforce single-instance constraint when multiInstance is false', async () => {
    appRuntime.registerApp({
      id: 'com.single.app',
      name: 'Single App',
      version: '1.0.0',
      multiInstance: false,
    });

    const inst1 = await appRuntime.launch('com.single.app');
    expect(inst1.state).toBe('running');

    await expect(appRuntime.launch('com.single.app')).rejects.toThrow(AppAlreadyRunningError);

    await appRuntime.terminate(inst1.instanceId);
  });

  it('should pause, resume, and restart an application', async () => {
    let pauseCount = 0;
    let resumeCount = 0;

    appRuntime.registerApp({
      id: 'com.lifecycle.app',
      name: 'Lifecycle App',
      version: '1.0.0',
      main: (context) => {
        context.onPause(() => { pauseCount++; });
        context.onResume(() => { resumeCount++; });
      },
    });

    const instance = await appRuntime.launch('com.lifecycle.app');

    await appRuntime.pause(instance.instanceId);
    expect(appRuntime.getInstance(instance.instanceId)?.state).toBe('paused');
    expect(pauseCount).toBe(1);

    await appRuntime.resume(instance.instanceId);
    expect(appRuntime.getInstance(instance.instanceId)?.state).toBe('running');
    expect(resumeCount).toBe(1);

    const restarted = await appRuntime.restart(instance.instanceId);
    expect(restarted.instanceId).not.toBe(instance.instanceId);
    expect(restarted.state).toBe('running');

    await appRuntime.terminate(restarted.instanceId);
  });

  it('should emit lifecycle events on launch, pause, resume, and terminate', async () => {
    const events: string[] = [];
    eventBus.subscribe('app:launching', () => { events.push('launching'); });
    eventBus.subscribe('app:started', () => { events.push('started'); });
    eventBus.subscribe('app:paused', () => { events.push('paused'); });
    eventBus.subscribe('app:resumed', () => { events.push('resumed'); });
    eventBus.subscribe('app:stopping', () => { events.push('stopping'); });
    eventBus.subscribe('app:stopped', () => { events.push('stopped'); });

    const instance = await appRuntime.launch('com.webos.notepad');
    await appRuntime.pause(instance.instanceId);
    await appRuntime.resume(instance.instanceId);
    await appRuntime.terminate(instance.instanceId);

    expect(events).toEqual(['launching', 'started', 'paused', 'resumed', 'stopping', 'stopped']);
  });
});
