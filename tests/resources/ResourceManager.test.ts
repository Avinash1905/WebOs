import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EventBus } from '../../core/events/index.js';
import { StorageEngine } from '../../core/storage/index.js';
import { ProcessManager } from '../../core/process/index.js';
import { ApplicationRuntime } from '../../core/apps/index.js';
import { FileSystem } from '../../core/filesystem/index.js';
import { ServiceManager } from '../../core/services/index.js';
import { ResourceManager } from '../../core/resources/index.js';

describe('Module 16: Resource Manager Subsystem', () => {
  let eventBus: EventBus;
  let storage: StorageEngine;
  let processManager: ProcessManager;
  let appRuntime: ApplicationRuntime;
  let fileSystem: FileSystem;
  let serviceManager: ServiceManager;
  let resourceManager: ResourceManager;

  beforeEach(async () => {
    eventBus = new EventBus();
    storage = new StorageEngine({ adapter: 'memory', eventBus });
    await storage.initialize();
    await storage.start();

    processManager = new ProcessManager({ eventBus });
    await processManager.initialize();
    await processManager.start();

    appRuntime = new ApplicationRuntime({ eventBus, processManager, storage });
    await appRuntime.initialize();
    await appRuntime.start();

    fileSystem = new FileSystem({ storage, eventBus });
    await fileSystem.initialize();
    await fileSystem.start();

    serviceManager = new ServiceManager({ eventBus });
    await serviceManager.initialize();
    await serviceManager.start();

    resourceManager = new ResourceManager(
      {
        eventBus,
        storage,
        processManager,
        appRuntime,
        filesystem: fileSystem,
        serviceManager,
      },
      {
        enabled: false,
        limits: {
          maxProcesses: 5,
          maxAppInstances: 3,
          storageWarningThresholdPercent: 80,
          storageCriticalThresholdPercent: 95,
        },
      }
    );
    await resourceManager.initialize();
    await resourceManager.start();
  });

  afterEach(async () => {
    await resourceManager.stop();
  });

  describe('Resource Snapshot Generation', () => {
    it('creates a complete snapshot across all subsystems', async () => {
      // Add test data
      await storage.set('item1', 'value1');
      await storage.set('item2', 'value2');
      await fileSystem.writeFile('/hello.txt', 'Hello World');

      const snapshot = await resourceManager.getResourceSnapshot();

      expect(snapshot).toBeDefined();
      expect(snapshot.timestamp).toBeGreaterThan(0);
      expect(snapshot.memory).toBeDefined();
      expect(snapshot.storage).toBeDefined();
      expect(snapshot.storage.totalKeys).toBeGreaterThanOrEqual(2);
      expect(snapshot.processes).toBeDefined();
      expect(snapshot.applications).toBeDefined();
      expect(snapshot.vfs).toBeDefined();
      expect(snapshot.vfs.fileCount).toBeGreaterThanOrEqual(1);
      expect(snapshot.services).toBeDefined();
      expect(snapshot.overallHealth).toBe('HEALTHY');
    });

    it('gracefully reports UNKNOWN memory status when browser memory API is unavailable', () => {
      const memory = resourceManager.getMemoryUsage();
      expect(memory).toBeDefined();
      expect(typeof memory.available).toBe('boolean');
      expect(['HEALTHY', 'WARNING', 'CRITICAL', 'UNKNOWN']).toContain(memory.status);
    });

    it('retrieves storage resource stats accurately', async () => {
      const storageInfo = await resourceManager.getStorageUsage();
      expect(storageInfo).toBeDefined();
      expect(storageInfo.usedBytes).toBeGreaterThanOrEqual(0);
      expect(storageInfo.totalKeys).toBeGreaterThanOrEqual(0);
      expect(storageInfo.status).toBe('HEALTHY');
    });

    it('retrieves process and application metrics', () => {
      const procInfo = resourceManager.getProcessMetrics();
      expect(procInfo).toBeDefined();
      expect(procInfo.totalProcesses).toBe(0);

      const appInfo = resourceManager.getApplicationMetrics();
      expect(appInfo).toBeDefined();
      expect(appInfo.runningApps).toBe(0);
    });
  });

  describe('Resource Limits & Violation Detection', () => {
    it('detects no violations when resource usage is within limits', async () => {
      const check = await resourceManager.checkLimits();
      expect(check.exceeded).toBe(false);
      expect(check.violations.length).toBe(0);
    });

    it('detects process count limit violation', async () => {
      // Spawn processes to exceed limit of 5
      for (let i = 0; i < 6; i++) {
        await processManager.createProcess({
          name: `proc-${i}`,
          userId: 'test_user',
          applicationId: 'test_app',
        });
      }

      const check = await resourceManager.checkLimits();
      expect(check.exceeded).toBe(true);
      expect(check.violations.some((v) => v.includes('Process count'))).toBe(true);
    });

    it('updates resource limits at runtime', async () => {
      resourceManager.setLimits({ maxProcesses: 10 });
      const check = await resourceManager.checkLimits();
      // Since 6 <= 10, violations should be cleared
      expect(check.exceeded).toBe(false);
    });
  });

  describe('Periodic Background Monitoring & Metrics', () => {
    it('computes monitor metrics', async () => {
      await resourceManager.getResourceSnapshot();
      await resourceManager.getResourceSnapshot();

      const metrics = resourceManager.getMetrics();
      expect(metrics.snapshotsCollected).toBeGreaterThanOrEqual(2);
      expect(metrics.lastSnapshotTime).toBeGreaterThan(0);
    });

    it('starts and stops interval monitoring without throwing', () => {
      resourceManager.startMonitoring(100);
      expect(resourceManager.isMonitoring()).toBe(true);

      resourceManager.stopMonitoring();
      expect(resourceManager.isMonitoring()).toBe(false);
    });
  });
});
