import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Kernel } from '../../core/kernel/Kernel.js';
import { EventBus } from '../../core/events/EventBus.js';
import { StorageEngine } from '../../core/storage/StorageEngine.js';
import { UserManager, USER_ROLES } from '../../core/users/index.js';
import { PermissionManager } from '../../core/permissions/PermissionManager.js';
import { FileSystem } from '../../core/filesystem/FileSystem.js';
import { TrashManager } from '../../core/trash/TrashManager.js';
import { ProcessManager } from '../../core/process/ProcessManager.js';
import { Scheduler } from '../../core/scheduler/Scheduler.js';
import { Shell } from '../../core/shell/Shell.js';
import { ClipboardManager } from '../../core/clipboard/ClipboardManager.js';
import { SearchEngine } from '../../core/search/SearchEngine.js';
import { ApplicationRuntime } from '../../core/apps/ApplicationRuntime.js';

describe('OS Core Full System Integration (14 Subsystems)', () => {
  let kernel: Kernel;
  let eventBus: EventBus;
  let storage: StorageEngine;
  let userManager: UserManager;
  let permissionManager: PermissionManager;
  let fileSystem: FileSystem;
  let trashManager: TrashManager;
  let processManager: ProcessManager;
  let scheduler: Scheduler;
  let shell: Shell;
  let clipboard: ClipboardManager;
  let search: SearchEngine;
  let apps: ApplicationRuntime;

  beforeEach(async () => {
    kernel = new Kernel();

    // 1. EventBus
    eventBus = new EventBus();
    kernel.registerService(eventBus);

    // 2. Storage
    storage = new StorageEngine({ adapter: 'memory', eventBus });
    kernel.registerService(storage);

    // 3. Users
    userManager = new UserManager({ eventBus, storage });
    kernel.registerService(userManager);

    // 4. Permissions
    permissionManager = new PermissionManager({ eventBus, storage, userManager });
    kernel.registerService(permissionManager);

    // 5. FileSystem
    fileSystem = new FileSystem({
      eventBus,
      storage,
      userManager,
      permissionManager,
    });
    userManager.attachFileSystem(fileSystem);
    kernel.registerService(fileSystem);

    // 6. Trash
    trashManager = new TrashManager({ eventBus, storage, fileSystem });
    fileSystem.attachTrashManager(trashManager);
    kernel.registerService(trashManager);

    // 7. ProcessManager
    processManager = new ProcessManager({
      eventBus,
      userManager,
      permissionManager,
      fileSystem,
    });
    kernel.registerService(processManager);

    // 8. Scheduler
    scheduler = new Scheduler({ processManager });
    kernel.registerService(scheduler);

    // 9. Clipboard
    clipboard = new ClipboardManager({
      eventBus,
      storage,
      fileSystem,
      permissionManager,
    });
    kernel.registerService(clipboard);

    // 10. Search
    search = new SearchEngine({
      eventBus,
      fileSystem,
      permissionManager,
      storage,
    });
    kernel.registerService(search);

    // 11. Apps
    apps = new ApplicationRuntime({
      eventBus,
      storage,
      filesystem: fileSystem,
      userManager,
      permissionManager,
      processManager,
      clipboardManager: clipboard,
    });
    kernel.registerService(apps);

    // 12. Shell
    shell = new Shell({
      fileSystem,
      userManager,
      permissionManager,
      processManager,
      scheduler,
    });
    kernel.registerService(shell);

    // Cross-wire EventBus to Kernel
    eventBus.attachToKernel(kernel);

    // Boot the entire OS Core Kernel
    await kernel.initialize();
    await kernel.start();
  });

  afterEach(async () => {
    await kernel.stop();
  });

  it('should successfully boot all registered services in dependency order', () => {
    expect(kernel.getStatus()).toBe('RUNNING');
    expect(kernel.getService('event-bus')?.getStatus()).toBe('RUNNING');
    expect(kernel.getService('storage')?.getStatus()).toBe('RUNNING');
    expect(kernel.getService('users')?.getStatus()).toBe('RUNNING');
    expect(kernel.getService('permissions')?.getStatus()).toBe('RUNNING');
    expect(kernel.getService('filesystem')?.getStatus()).toBe('RUNNING');
    expect(kernel.getService('trash')?.getStatus()).toBe('RUNNING');
    expect(kernel.getService('process-manager')?.getStatus()).toBe('RUNNING');
    expect(kernel.getService('scheduler')?.getStatus()).toBe('RUNNING');
    expect(kernel.getService('clipboard')?.getStatus()).toBe('RUNNING');
    expect(kernel.getService('search')?.getStatus()).toBe('RUNNING');
    expect(kernel.getService('apps')?.getStatus()).toBe('RUNNING');
    expect(kernel.getService('shell')?.getStatus()).toBe('RUNNING');
  });

  it('should run an integrated end-to-end OS workflow across all subsystems', async () => {
    // 1. User management & session
    const user = await userManager.createUser({
      username: 'alice',
      displayName: 'Alice Cooper',
      role: USER_ROLES.USER,
      provisionHomeDirectory: true,
    });
    await userManager.switchUser(user.id);
    expect(userManager.getCurrentUser()?.id).toBe(user.id);

    // Ensure alice's home folder is available
    expect(await fileSystem.exists('/home/alice/Documents')).toBe(true);

    // 2. Shell file operations
    const session = shell.createSession({ userId: user.id });
    const echoRes = await session.execute('echo "Project Plan 2026"');
    expect(echoRes.success).toBe(true);

    await fileSystem.createFile('/home/alice/Documents/plan.txt', { content: 'Project Plan 2026' }, { userId: user.id });
    expect(await fileSystem.exists('/home/alice/Documents/plan.txt')).toBe(true);

    // 3. Search indexing & discovery
    const searchRes = await search.search({ query: 'plan' });
    expect(searchRes.total).toBeGreaterThanOrEqual(1);
    expect(searchRes.items.some((i) => i.path === '/home/alice/Documents/plan.txt')).toBe(true);

    // 4. Clipboard copy & paste
    clipboard.copy('file', '/home/alice/Documents/plan.txt', { sourcePath: '/home/alice/Documents/plan.txt' });
    await clipboard.paste('/home/alice/Documents/plan_backup.txt');
    expect(await fileSystem.exists('/home/alice/Documents/plan_backup.txt')).toBe(true);

    // 5. Application Runtime launch & execution
    const noteApp = await apps.launch('com.webos.notepad', {
      userId: user.id,
      args: { openPath: '/home/alice/Documents/plan.txt' },
    });
    expect(noteApp.state).toBe('running');
    expect(noteApp.processId).toBeGreaterThan(0);

    // Verify process is registered with ProcessManager
    const proc = processManager.getProcess(noteApp.processId);
    expect(proc).toBeDefined();
    expect(proc?.name).toBe('Text Editor');

    // 6. Application termination
    await apps.terminate(noteApp.instanceId);
    expect(apps.isAppRunning('com.webos.notepad')).toBe(false);

    // 7. Shell stats & process inspection
    const psRes = await session.execute('ps');
    expect(psRes.success).toBe(true);
  });
});
