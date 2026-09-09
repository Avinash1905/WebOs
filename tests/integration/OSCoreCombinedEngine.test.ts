import { describe, expect, it } from 'vitest';
import { EventBus } from '../../core/events/index.js';
import { FileSystem } from '../../core/filesystem/index.js';
import { Kernel } from '../../core/kernel/index.js';
import { PermissionManager } from '../../core/permissions/index.js';
import { ProcessManager } from '../../core/process/index.js';
import { Scheduler } from '../../core/scheduler/index.js';
import { Shell } from '../../core/shell/index.js';
import { StorageEngine } from '../../core/storage/index.js';
import { TrashManager } from '../../core/trash/index.js';
import { UserManager, USER_ROLES } from '../../core/users/index.js';

describe('WebOS 10-Module Core Engine Combined Integration', () => {
  it('boots all 10 OS subsystems in topological order and executes end-to-end workflows', async () => {
    const kernel = new Kernel();
    const eventBus = new EventBus();
    const storage = new StorageEngine({ adapter: 'memory', eventBus });

    const userManager = new UserManager({ storage, eventBus });
    const permManager = new PermissionManager({ storage, eventBus, userManager });
    const fs = new FileSystem({ storage, eventBus, permissionManager: permManager, userManager });
    const trashManager = new TrashManager({ storage, eventBus, fileSystem: fs });
    const procManager = new ProcessManager({ eventBus, userManager, permissionManager: permManager, fileSystem: fs });
    const scheduler = new Scheduler({ storage, eventBus, processManager: procManager });
    const shell = new Shell({
      storage,
      eventBus,
      fileSystem: fs,
      permissionManager: permManager,
      userManager,
      processManager: procManager,
      scheduler,
      trashManager,
    });

    // Cross-service connections
    userManager.attachFileSystem(fs);
    fs.attachTrashManager(trashManager);
    scheduler.attachProcessManager(procManager);

    // Register all services with Kernel
    kernel.registerService(eventBus);
    kernel.registerService(storage);
    kernel.registerService(userManager);
    kernel.registerService(permManager);
    kernel.registerService(fs);
    kernel.registerService(trashManager);
    kernel.registerService(procManager);
    kernel.registerService(scheduler);
    kernel.registerService(shell);

    eventBus.attachToKernel(kernel);

    // Boot WebOS
    await kernel.initialize();
    await kernel.start();

    expect(kernel.getStatus()).toBe('RUNNING');
    expect(kernel.getService('scheduler')?.getStatus()).toBe('RUNNING');
    expect(kernel.getService('shell')?.getStatus()).toBe('RUNNING');

    // 1. User & Shell Session
    const charlie = await userManager.createUser({
      username: 'charlie',
      role: USER_ROLES.USER,
      provisionHomeDirectory: true,
    });
    const charlieSession = shell.createSession({ userId: charlie.id });

    // 2. Execute Shell VFS Commands
    await charlieSession.execute('mkdir -p src');
    await charlieSession.execute('write src/main.ts \'console.log("WebOS Running");\'');
    const readRes = await charlieSession.execute('cat src/main.ts');
    expect(readRes.output).toBe('console.log("WebOS Running");');

    // 3. Process Creation & Scheduler Integration
    const proc = await procManager.createProcess({
      name: 'CompilerTask',
      userId: charlie.id,
      priority: 'HIGH',
      autoStart: true,
    });
    scheduler.startProcessScheduling(proc.pid);

    const runProc = scheduler.step();
    expect(runProc?.pid).toBe(proc.pid);
    expect(scheduler.getRunningProcess()?.pid).toBe(proc.pid);

    // 4. Shell Process Inspection
    const psRes = await charlieSession.execute('ps');
    expect(psRes.output).toContain('CompilerTask');

    // 5. Safe Deletion to Trash via Shell
    await charlieSession.execute('rm src/main.ts');
    const trashList = await trashManager.listTrash();
    expect(trashList.length).toBe(1);
    expect(trashList[0]?.originalName).toBe('main.ts');

    // 6. Graceful Shutdown
    await kernel.stop();
    expect(kernel.getStatus()).toBe('STOPPED');
  });
});
