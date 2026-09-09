import { describe, expect, it } from 'vitest';
import { EventBus } from '../../core/events/index.js';
import {
  InvalidProcessStateError,
  ProcessManager,
  ProcessPermissionError,
} from '../../core/process/index.js';

describe('Process Manager Subsystem', () => {
  describe('Process Creation & PID Allocation', () => {
    it('allocates unique monotonic PIDs for created processes', async () => {
      const procManager = new ProcessManager({ startPid: 100 });
      await procManager.initialize();

      const p1 = await procManager.createProcess({ name: 'Terminal' });
      const p2 = await procManager.createProcess({ name: 'TextEditor' });
      const p3 = await procManager.createProcess({ name: 'FileManager' });

      expect(p1.pid).toBe(100);
      expect(p2.pid).toBe(101);
      expect(p3.pid).toBe(102);

      expect(p1.state).toBe('CREATED');
      expect(p1.name).toBe('Terminal');
      expect(p1.applicationId).toBe('app.webos.terminal');
    });

    it('populates environment variables and working directory', async () => {
      const procManager = new ProcessManager();
      await procManager.initialize();

      const proc = await procManager.createProcess({
        name: 'Shell',
        userId: 'alice',
        cwd: '/home/alice/Projects',
        env: { DEBUG: 'true' },
      });

      expect(proc.userId).toBe('alice');
      expect(proc.cwd).toBe('/home/alice/Projects');
      expect(proc.env.USER).toBe('alice');
      expect(proc.env.HOME).toBe('/home/alice/Projects');
      expect(proc.env.DEBUG).toBe('true');
    });
  });

  describe('Lifecycle State Transitions', () => {
    it('follows valid transitions: CREATED -> RUNNING -> PAUSED -> RUNNING -> TERMINATED', async () => {
      const procManager = new ProcessManager();
      await procManager.initialize();

      const p = await procManager.createProcess({ name: 'MusicPlayer', userId: 'user_1' });
      expect(p.state).toBe('CREATED');

      const running = await procManager.startProcess(p.pid, { userId: 'user_1' });
      expect(running.state).toBe('RUNNING');
      expect(running.startedAt).toBeDefined();

      const paused = await procManager.pauseProcess(p.pid, { userId: 'user_1' });
      expect(paused.state).toBe('PAUSED');

      const resumed = await procManager.resumeProcess(p.pid, { userId: 'user_1' });
      expect(resumed.state).toBe('RUNNING');

      const terminated = await procManager.terminateProcess(p.pid, {
        exitCode: 0,
        reason: 'User Closed',
      }, { userId: 'user_1' });

      expect(terminated.state).toBe('TERMINATED');
      expect(terminated.stoppedAt).toBeDefined();
      expect(terminated.exitCode).toBe(0);
    });

    it('rejects invalid state transitions from terminal state', async () => {
      const procManager = new ProcessManager();
      await procManager.initialize();

      const p = await procManager.createProcess({ name: 'Browser', autoStart: true, userId: 'user_1' });
      await procManager.terminateProcess(p.pid, {}, { userId: 'user_1' });

      // Attempting to pause or resume terminated process must throw
      await expect(
        procManager.pauseProcess(p.pid, { userId: 'user_1' })
      ).rejects.toThrow(InvalidProcessStateError);

      await expect(
        procManager.resumeProcess(p.pid, { userId: 'user_1' })
      ).rejects.toThrow(InvalidProcessStateError);
    });
  });

  describe('Process Ownership & Security', () => {
    it('prevents normal users from terminating another user’s processes', async () => {
      const procManager = new ProcessManager();
      await procManager.initialize();

      const aliceProc = await procManager.createProcess({
        name: 'AliceTask',
        userId: 'alice',
        autoStart: true,
      });

      // Bob tries to terminate Alice's process
      await expect(
        procManager.terminateProcess(aliceProc.pid, {}, { userId: 'bob', role: 'USER' })
      ).rejects.toThrow(ProcessPermissionError);

      // Admin CAN terminate Alice's process
      const terminatedByAdmin = await procManager.terminateProcess(
        aliceProc.pid,
        {},
        { userId: 'admin_user', role: 'ADMIN' }
      );
      expect(terminatedByAdmin.state).toBe('TERMINATED');
    });
  });

  describe('Process Tree & Parent/Child Cascading', () => {
    it('constructs process hierarchy and cascades termination', async () => {
      const procManager = new ProcessManager();
      await procManager.initialize();

      const parent = await procManager.createProcess({
        name: 'Terminal',
        autoStart: true,
      });

      const child1 = await procManager.createProcess({
        name: 'Shell',
        parentPid: parent.pid,
        autoStart: true,
      });

      const child2 = await procManager.createProcess({
        name: 'Command',
        parentPid: child1.pid,
        autoStart: true,
      });

      expect(procManager.getChildProcesses(parent.pid).length).toBe(1);
      expect(procManager.getParentProcess(child1.pid)?.pid).toBe(parent.pid);
      expect(procManager.getParentProcess(child2.pid)?.pid).toBe(child1.pid);

      const tree = procManager.getProcessTree();
      expect(tree.length).toBe(1);
      expect(tree[0]?.process.pid).toBe(parent.pid);
      expect(tree[0]?.children[0]?.process.pid).toBe(child1.pid);

      // Terminating parent cascades to child processes
      await procManager.terminateProcess(parent.pid, { terminateChildren: true });

      expect(procManager.getProcess(parent.pid)?.state).toBe('TERMINATED');
      expect(procManager.getProcess(child1.pid)?.state).toBe('TERMINATED');
      expect(procManager.getProcess(child2.pid)?.state).toBe('TERMINATED');
    });
  });

  describe('Process Monitoring & Events', () => {
    it('computes accurate process statistics', async () => {
      const procManager = new ProcessManager();
      await procManager.initialize();

      await procManager.createProcess({ name: 'P1', userId: 'alice', autoStart: true });
      await procManager.createProcess({ name: 'P2', userId: 'alice', autoStart: true });
      const p3 = await procManager.createProcess({ name: 'P3', userId: 'bob', autoStart: true });
      await procManager.pauseProcess(p3.pid, { userId: 'bob' });

      const stats = procManager.getProcessStats();
      expect(stats.totalProcesses).toBe(3);
      expect(stats.runningProcesses).toBe(2);
      expect(stats.pausedProcesses).toBe(1);
      expect(stats.processesByUser['alice']).toBe(2);
      expect(stats.processesByUser['bob']).toBe(1);
    });

    it('emits lifecycle events through EventBus', async () => {
      const eventBus = new EventBus();
      const procManager = new ProcessManager({ eventBus });
      await procManager.initialize();

      const events: string[] = [];
      eventBus.subscribe('PROCESS_CREATED', (p) => {
        events.push(`created:${p.name}`);
      });
      eventBus.subscribe('PROCESS_STARTED', (p) => {
        events.push(`started:${p.name}`);
      });
      eventBus.subscribe('PROCESS_TERMINATED', (p) => {
        events.push(`terminated:${p.name}`);
      });

      const p = await procManager.createProcess({ name: 'EventTest', autoStart: true });
      await procManager.terminateProcess(p.pid);

      expect(events).toContain('created:EventTest');
      expect(events).toContain('started:EventTest');
      expect(events).toContain('terminated:EventTest');
    });
  });
});
