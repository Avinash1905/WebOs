import { describe, it, expect } from 'vitest';
import {
  ProcessGroupManager,
  VirtualIPC,
  SignalDispatcher,
  ProcessReaper,
  ProcessMemoryTracker
} from '../../core/process/index.js';

describe('Process Expansions', () => {
  describe('ProcessGroupManager', () => {
    it('should manage process groups and foreground state', () => {
      const pgm = new ProcessGroupManager();
      const group = pgm.createGroup(101);
      expect(group.pgid).toBe(101);
      expect(group.isForeground).toBe(true);

      pgm.joinGroup(101, 102);
      expect(pgm.getGroup(101)?.pids).toContain(102);
      expect(pgm.getGroupByPid(102)?.pgid).toBe(101);

      pgm.leaveGroup(102);
      expect(pgm.getGroup(101)?.pids).not.toContain(102);
    });
  });

  describe('VirtualIPC', () => {
    it('should create and transfer data across virtual pipes and message queues', () => {
      const ipc = new VirtualIPC();
      ipc.createPipe('pipe_1', { capacity: 1024 });

      const written = ipc.writePipe('pipe_1', new TextEncoder().encode('IPC_TEST_MESSAGE'));
      expect(written).toBe(16);

      const readBack = ipc.readPipe('pipe_1', 16);
      expect(new TextDecoder().decode(readBack)).toBe('IPC_TEST_MESSAGE');

      // Message queues
      let received: unknown = null;
      ipc.subscribeQueue('sys_channel', (payload) => {
        received = payload;
      });

      ipc.sendMessage('sys_channel', 101, { event: 'READY' });
      expect(received).toEqual({ event: 'READY' });
    });
  });

  describe('SignalDispatcher', () => {
    it('should dispatch signals and invoke installed handlers', () => {
      const dispatcher = new SignalDispatcher();
      let sigReceived: string | null = null;

      dispatcher.installHandler(101, 'SIGUSR1', (sig) => {
        sigReceived = sig;
      });

      const res = dispatcher.dispatch(101, 'SIGUSR1', 100);
      expect(res.delivered).toBe(true);
      expect(res.action).toBe('HANDLED');
      expect(sigReceived).toBe('SIGUSR1');
    });

    it('should queue masked signals and deliver upon unmasking', () => {
      const dispatcher = new SignalDispatcher();
      let count = 0;

      dispatcher.installHandler(102, 'SIGTERM', () => {
        count++;
      });

      dispatcher.maskSignal(102, 'SIGTERM');
      const resMasked = dispatcher.dispatch(102, 'SIGTERM');
      expect(resMasked.action).toBe('MASKED');
      expect(count).toBe(0);

      dispatcher.unmaskSignal(102, 'SIGTERM');
      expect(count).toBe(1);
    });
  });

  describe('ProcessReaper', () => {
    it('should collect zombie processes and reparent orphans', () => {
      const reaper = new ProcessReaper();
      reaper.recordProcess(201, 200); // pid 201 child of 200
      reaper.recordExit(201, 0);

      expect(reaper.getZombieCount()).toBe(1);
      const reaped = reaper.waitPid(200, 201);
      expect(reaped?.exitCode).toBe(0);
      expect(reaper.getZombieCount()).toBe(0);
    });
  });

  describe('ProcessMemoryTracker', () => {
    it('should track allocations and compute OOM scores', () => {
      const tracker = new ProcessMemoryTracker();
      tracker.trackProcess(301, 1024 * 1024); // 1MB limit

      expect(tracker.allocate(301, 512 * 1024)).toBe(true);
      expect(tracker.getUsage(301)?.heapBytes).toBe(512 * 1024);

      // Allocation exceeding remaining limit should fail
      expect(tracker.allocate(301, 600 * 1024)).toBe(false);

      const oomScore = tracker.calculateOOMScore(301);
      expect(oomScore).toBeGreaterThan(500);
    });
  });
});
