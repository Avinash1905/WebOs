import { describe, it, expect, beforeEach } from 'vitest';
import { EventBus } from '../../core/events/index.js';
import { StorageEngine } from '../../core/storage/index.js';
import { ProcessManager } from '../../core/process/index.js';
import { ServiceManager, ManagedSystemService } from '../../core/services/index.js';
import { ResourceManager } from '../../core/resources/index.js';
import {
  DiagnosticsManager,
  CheckNotFoundError,
  RecoveryAdvisor,
} from '../../core/diagnostics/index.js';

class BrokenService extends ManagedSystemService {
  public override readonly id: string;
  public override readonly name: string;

  constructor(id: string) {
    super();
    this.id = id;
    this.name = id;
  }
  protected override async onStart(): Promise<void> {
    throw new Error('Broken service failed to start');
  }
}

describe('Module 17: System Diagnostics Subsystem', () => {
  let eventBus: EventBus;
  let storage: StorageEngine;
  let processManager: ProcessManager;
  let serviceManager: ServiceManager;
  let resourceManager: ResourceManager;
  let diagnostics: DiagnosticsManager;

  beforeEach(async () => {
    eventBus = new EventBus();
    storage = new StorageEngine({ adapter: 'memory', eventBus });
    await storage.initialize();
    await storage.start();

    processManager = new ProcessManager({ eventBus });
    await processManager.initialize();
    await processManager.start();

    serviceManager = new ServiceManager({ eventBus });
    await serviceManager.initialize();
    await serviceManager.start();

    resourceManager = new ResourceManager(
      { eventBus, storage, processManager, serviceManager },
      { enabled: false }
    );
    await resourceManager.initialize();
    await resourceManager.start();

    diagnostics = new DiagnosticsManager(
      {
        eventBus,
        storage,
        processManager,
        serviceManager,
        resourceManager,
      },
      { eventBus }
    );
    await diagnostics.initialize();
    await diagnostics.start();
  });

  describe('Check Registration & Execution', () => {
    it('registers 15 default system health checks', () => {
      const checks = diagnostics.getChecks();
      expect(checks.length).toBe(15);
      expect(diagnostics.hasCheck('storage')).toBe(true);
      expect(diagnostics.hasCheck('process')).toBe(true);
      expect(diagnostics.hasCheck('services')).toBe(true);
      expect(diagnostics.hasCheck('resources')).toBe(true);
    });

    it('allows registering custom diagnostic checks', async () => {
      diagnostics.registerCheck({
        id: 'custom-check',
        name: 'Custom Component Check',
        description: 'Verifies custom component health',
        category: 'Custom',
        severity: 'LOW',
        run: async () => ({
          checkId: 'custom-check',
          name: 'Custom Component Check',
          category: 'Custom',
          severity: 'LOW',
          status: 'PASS',
          timestamp: Date.now(),
          message: 'Custom check OK',
        }),
      });

      expect(diagnostics.hasCheck('custom-check')).toBe(true);
      const result = await diagnostics.runCheck('custom-check');
      expect(result.status).toBe('PASS');
      expect(result.message).toBe('Custom check OK');
    });

    it('throws CheckNotFoundError when running non-existent check', async () => {
      await expect(diagnostics.runCheck('non-existent')).rejects.toThrow(CheckNotFoundError);
    });

    it('runs single check on storage engine', async () => {
      const result = await diagnostics.runCheck('storage');
      expect(result.checkId).toBe('storage');
      expect(result.status).toBe('PASS');
      expect(result.message).toContain('Storage ready');
    });
  });

  describe('Full Diagnostics Report & Health Assessment', () => {
    it('runs all diagnostic checks and generates a structured report', async () => {
      const report = await diagnostics.runAllChecks();

      expect(report).toBeDefined();
      expect(report.reportId).toMatch(/^diag_rep_/);
      expect(report.timestamp).toBeGreaterThan(0);
      expect(report.totalChecks).toBe(15);
      expect(report.passedCount).toBeGreaterThan(0);
      expect(report.overallHealth).toBe('HEALTHY');
      expect(Array.isArray(report.results)).toBe(true);
    });

    it('detects degraded health and issues recovery advice when service fails', async () => {
      const broken = new BrokenService('crash-svc');
      serviceManager.registerService(broken);
      try {
        await serviceManager.startService('crash-svc');
      } catch {
        // expected failure
      }

      const report = await diagnostics.runAllChecks();
      expect(report.failCount).toBeGreaterThan(0);
      expect(report.overallHealth).toBe('UNHEALTHY');

      const advice = diagnostics.getRecoveryAdvice();
      expect(advice.length).toBeGreaterThan(0);
      expect(advice.some((r) => r.toLowerCase().includes('service'))).toBe(true);
    });
  });

  describe('Error Tracking & Recovery Advisor', () => {
    it('records and queries system errors by subsystem and severity', () => {
      diagnostics.recordError('storage', new Error('Disk write failed'), 'HIGH', { path: '/data' });
      diagnostics.recordError('vfs', 'File corrupted', 'MEDIUM');
      diagnostics.recordError('storage', new Error('Quota exceeded'), 'CRITICAL');

      expect(diagnostics.getErrorCount()).toBe(3);

      const storageErrors = diagnostics.getErrors({ subsystem: 'storage' });
      expect(storageErrors.length).toBe(2);

      const criticalErrors = diagnostics.getErrors({ severity: 'CRITICAL' });
      expect(criticalErrors.length).toBe(1);
      expect(criticalErrors[0]?.message).toBe('Quota exceeded');
    });

    it('generates recovery advice via RecoveryAdvisor', () => {
      const recs = RecoveryAdvisor.getRecommendations([
        {
          checkId: 'storage',
          name: 'Storage',
          category: 'Storage',
          severity: 'HIGH',
          status: 'FAIL',
          timestamp: Date.now(),
          message: 'Storage full',
        },
        {
          checkId: 'scheduler',
          name: 'Scheduler',
          category: 'Process',
          severity: 'HIGH',
          status: 'WARNING',
          timestamp: Date.now(),
          message: 'Queue stalled',
        },
      ]);

      expect(recs.length).toBe(2);
      expect(recs.some((r) => r.includes('storage quota'))).toBe(true);
      expect(recs.some((r) => r.includes('Scheduler'))).toBe(true);
    });

    it('emits diagnostic events over EventBus', async () => {
      const events: string[] = [];
      eventBus.subscribe('diagnostics.started', () => { events.push('started'); });
      eventBus.subscribe('diagnostics.completed', () => { events.push('completed'); });
      eventBus.subscribe('diagnostics.errorRecorded', () => { events.push('errorRecorded'); });

      diagnostics.recordError('kernel', 'Test error', 'LOW');
      await diagnostics.runAllChecks();

      expect(events).toContain('errorRecorded');
      expect(events).toContain('started');
      expect(events).toContain('completed');
    });
  });
});
