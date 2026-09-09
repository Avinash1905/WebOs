import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Kernel } from '../../core/kernel/index.js';
import { EventBus } from '../../core/events/index.js';
import { StorageEngine } from '../../core/storage/index.js';
import { FileSystem } from '../../core/filesystem/index.js';
import { TrashManager } from '../../core/trash/index.js';
import { UserManager } from '../../core/users/index.js';
import { PermissionManager } from '../../core/permissions/index.js';
import { ProcessManager } from '../../core/process/index.js';
import { Scheduler } from '../../core/scheduler/index.js';
import { Shell } from '../../core/shell/index.js';
import { ApplicationRuntime } from '../../core/apps/index.js';
import { SearchEngine } from '../../core/search/index.js';
import { ClipboardManager } from '../../core/clipboard/index.js';
import { ServiceManager, ManagedSystemService } from '../../core/services/index.js';
import { ResourceManager } from '../../core/resources/index.js';
import { DiagnosticsManager } from '../../core/diagnostics/index.js';

class BackgroundSyncService extends ManagedSystemService {
  public override readonly id = 'background-sync';
  public override readonly name = 'background-sync';
  public override readonly dependencies: readonly string[] = [];

  public syncCount = 0;

  constructor() {
    super();
  }

  protected override async onStart(): Promise<void> {
    this.syncCount++;
  }

  protected override async onStop(): Promise<void> {
    this.syncCount = 0;
  }
}

describe('Module 15-17 Full OS Core Diagnostics Integration', () => {
  let kernel: Kernel;
  let eventBus: EventBus;
  let storage: StorageEngine;
  let filesystem: FileSystem;
  let trashManager: TrashManager;
  let userManager: UserManager;
  let permissionManager: PermissionManager;
  let processManager: ProcessManager;
  let scheduler: Scheduler;
  let shell: Shell;
  let appRuntime: ApplicationRuntime;
  let searchEngine: SearchEngine;
  let clipboardManager: ClipboardManager;
  let serviceManager: ServiceManager;
  let resourceManager: ResourceManager;
  let diagnostics: DiagnosticsManager;

  beforeEach(async () => {
    // 1. Kernel & EventBus
    kernel = new Kernel();
    eventBus = new EventBus();

    // 2. Storage & FileSystem
    storage = new StorageEngine({ adapter: 'memory', eventBus });
    permissionManager = new PermissionManager({ storage, eventBus });
    userManager = new UserManager({ storage, eventBus });
    filesystem = new FileSystem({ storage, eventBus, permissionManager, userManager });
    trashManager = new TrashManager({ storage, eventBus, fileSystem: filesystem });

    // 3. Process & Scheduler & Shell
    processManager = new ProcessManager({ eventBus, userManager, permissionManager, fileSystem: filesystem });
    scheduler = new Scheduler({ processManager, eventBus });
    shell = new Shell({ fileSystem: filesystem, processManager, eventBus });

    // 4. Applications & Utilities
    appRuntime = new ApplicationRuntime({ eventBus, storage, filesystem, processManager, userManager, permissionManager });
    searchEngine = new SearchEngine({ fileSystem: filesystem, eventBus, permissionManager, storage });
    clipboardManager = new ClipboardManager({ eventBus });

    // 5. Services, Resources, Diagnostics
    serviceManager = new ServiceManager({ eventBus });
    resourceManager = new ResourceManager(
      {
        eventBus,
        storage,
        processManager,
        appRuntime,
        filesystem,
        serviceManager,
      },
      { enabled: false, limits: { maxProcesses: 10, maxAppInstances: 5 } }
    );

    diagnostics = new DiagnosticsManager(
      {
        kernel,
        eventBus,
        storage,
        filesystem,
        trashManager,
        userManager,
        permissionManager,
        processManager,
        scheduler,
        shell,
        appRuntime,
        searchEngine,
        clipboardManager,
        serviceManager,
        resourceManager,
      },
      { eventBus }
    );

    // Register all with Kernel
    kernel.registerService(eventBus);
    kernel.registerService(storage);
    kernel.registerService(userManager);
    kernel.registerService(permissionManager);
    kernel.registerService(filesystem);
    kernel.registerService(trashManager);
    kernel.registerService(processManager);
    kernel.registerService(scheduler);
    kernel.registerService(shell);
    kernel.registerService(appRuntime);
    kernel.registerService(searchEngine);
    kernel.registerService(clipboardManager);
    kernel.registerService(serviceManager);
    kernel.registerService(resourceManager);
    kernel.registerService(diagnostics);

    // Boot Kernel
    await kernel.initialize();
    await kernel.start();
  });

  afterEach(async () => {
    await kernel.stop();
  });

  it('runs complete OS Core lifecycle, gathers resource snapshots, and performs healthy system diagnostic', async () => {
    // 1. Create a user session
    const user = await userManager.createUser({ username: 'developer' });
    await userManager.createSession(user.id);

    // 2. Perform file operations and search
    await filesystem.writeFile('/notes.txt', 'System architecture draft', {}, { isSystem: true });
    const searchResults = await searchEngine.search({ query: 'notes' });
    expect(searchResults.items.length).toBeGreaterThanOrEqual(1);

    // 3. Register and start background service
    const syncSvc = new BackgroundSyncService();
    serviceManager.registerService(syncSvc);
    await serviceManager.startService('background-sync');
    expect(syncSvc.getStatus()).toBe('RUNNING');

    // 4. Capture resource snapshot
    const snapshot = await resourceManager.getResourceSnapshot();
    expect(snapshot.overallHealth).toBe('HEALTHY');
    expect(snapshot.vfs.fileCount).toBeGreaterThanOrEqual(1);
    expect(snapshot.services.running).toBeGreaterThanOrEqual(1);

    // 5. Run full system diagnostics
    const report = await diagnostics.runAllChecks();
    expect(report.overallHealth).toBe('HEALTHY');
    expect(report.totalChecks).toBe(15);
    expect(report.failCount).toBe(0);
    expect(report.passedCount).toBe(15);
  });
});
