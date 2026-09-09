import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  BaseSystemService,
  KernelBootManager,
  KernelWatchdog,
  KernelPanicHandler,
  KernelStateSnapshotManager,
  KernelMetricsCollector,
  KernelTracing,
  KernelConfigValidator,
} from '../../core/kernel/index.js';

class TestService extends BaseSystemService {
  public override readonly name: string;
  public override readonly dependencies: readonly string[];

  public started = false;
  public stopped = false;

  constructor(name: string, dependencies: readonly string[] = []) {
    super();
    this.name = name;
    this.dependencies = dependencies;
  }

  protected override async onStart(): Promise<void> {
    this.started = true;
  }

  protected override async onStop(): Promise<void> {
    this.stopped = true;
  }
}

describe('Module 1: Kernel Deep Expansions', () => {
  describe('KernelBootManager & Lifecycle Rollback', () => {
    it('executes staged boot sequence with stage hooks', async () => {
      const bootManager = new KernelBootManager();
      const stagesExecuted: string[] = [];

      bootManager.registerHook('PRE_INIT', 'hook1', () => { stagesExecuted.push('pre_init'); });
      bootManager.registerHook('CORE_INIT', 'hook2', () => { stagesExecuted.push('core_init'); });
      bootManager.registerHook('SERVICES_START', 'hook3', () => { stagesExecuted.push('services_start'); });
      bootManager.registerHook('POST_BOOT', 'hook4', () => { stagesExecuted.push('post_boot'); });

      const s1 = new TestService('s1');
      const s2 = new TestService('s2', ['s1']);

      await bootManager.executeBootSequence([s2, s1]);

      expect(bootManager.getCurrentStage()).toBe('READY');
      expect(stagesExecuted).toEqual(['pre_init', 'core_init', 'services_start', 'post_boot']);
      expect(s1.getStatus()).toBe('RUNNING');
      expect(s2.getStatus()).toBe('RUNNING');
    });

    it('rolls back started services if later service fails during boot', async () => {
      const bootManager = new KernelBootManager();
      const s1 = new TestService('s1');

      class FailingService extends BaseSystemService {
        public override readonly name = 'failing';
        public override readonly dependencies = ['s1'];
        protected override async onStart(): Promise<void> {
          throw new Error('Fatal service startup failure');
        }
      }

      const s2 = new FailingService();

      await expect(bootManager.executeBootSequence([s1, s2])).rejects.toThrow('Fatal service startup failure');
      expect(s1.stopped).toBe(true);
    });
  });

  describe('KernelWatchdog', () => {
    let watchdog: KernelWatchdog;

    beforeEach(() => {
      watchdog = new KernelWatchdog({ checkIntervalMs: 50, defaultTimeoutMs: 100, maxMissedHeartbeats: 2 });
    });

    afterEach(() => {
      watchdog.stop();
    });

    it('detects hung services when heartbeats are missed', async () => {
      const service = new TestService('monitored');
      await service.initialize();
      await service.start();

      watchdog.registerService(service);
      const hungDetected: string[] = [];
      watchdog.onHang((name) => { hungDetected.push(name); });

      // First check - healthy
      let hung = await watchdog.performHealthCheck();
      expect(hung.length).toBe(0);

      // Simulate passage of time
      await new Promise((r) => setTimeout(r, 120));
      await watchdog.performHealthCheck(); // missed 1

      await new Promise((r) => setTimeout(r, 120));
      hung = await watchdog.performHealthCheck(); // missed 2 -> trigger hang

      expect(hung).toContain('monitored');
      expect(hungDetected).toContain('monitored');
    });
  });

  describe('KernelPanicHandler & State Snapshots', () => {
    it('captures crash dump on panic', () => {
      const panicHandler = new KernelPanicHandler();
      const dump = panicHandler.triggerPanic('Out of critical kernel resources', {
        sourceService: 'storage',
        error: new Error('Critical disk failure'),
        kernelState: 'RUNNING',
        runningServices: ['event-bus', 'storage'],
        uptimeMs: 42000,
        metadata: { node: 'worker-1' },
      });

      expect(dump).toBeDefined();
      expect(dump.reason).toBe('Out of critical kernel resources');
      expect(panicHandler.isDegraded()).toBe(true);
      expect(panicHandler.getPanicCount()).toBe(1);
    });

    it('creates and restores kernel checkpoints', () => {
      const snapshotManager = new KernelStateSnapshotManager();
      const chk = snapshotManager.createCheckpoint('RUNNING', [
        { name: 'events', status: 'RUNNING', dependencies: [], optionalDependencies: [] },
        { name: 'storage', status: 'RUNNING', dependencies: ['events'], optionalDependencies: [] },
      ]);

      expect(chk.checkpointId).toMatch(/^chk_/);
      expect(chk.services.length).toBe(2);

      const latest = snapshotManager.getLatestCheckpoint();
      expect(latest?.checkpointId).toBe(chk.checkpointId);
    });
  });

  describe('KernelTracing & Metrics', () => {
    it('creates span hierarchy and computes metrics', () => {
      const tracing = new KernelTracing();
      const parent = tracing.startSpan('boot_sequence');
      const child = tracing.startSpan('init_storage', parent.id, 'storage');

      tracing.addLog(child.id, 'Storage adapter connected');
      tracing.endSpan(child.id, 'COMPLETED');
      tracing.endSpan(parent.id, 'COMPLETED');

      expect(parent.durationMs).toBeGreaterThanOrEqual(0);
      expect(child.durationMs).toBeGreaterThanOrEqual(0);
      expect(child.logs.length).toBe(1);

      const metrics = new KernelMetricsCollector();
      metrics.markBootStart();
      metrics.recordServiceStart('storage', 15.5);
      metrics.markBootComplete();

      const report = metrics.getReport();
      expect(report.totalServiceStarts).toBe(1);
      expect(report.serviceLatenciesMs['storage']?.startMs).toBe(15.5);
    });

    it('validates and sanitizes kernel config', () => {
      expect(() => KernelConfigValidator.validate({ serviceTimeoutMs: -100 })).toThrow();
      const sanitized = KernelConfigValidator.sanitize({ serviceTimeoutMs: 5000 });
      expect(sanitized.serviceTimeoutMs).toBe(5000);
      expect(sanitized.autoInitializeOnStart).toBe(true);
    });
  });
});
