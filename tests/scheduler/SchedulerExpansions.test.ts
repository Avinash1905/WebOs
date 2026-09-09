import { describe, it, expect } from 'vitest';
import {
  MLFQScheduler,
  CFSScheduler,
  RealTimeScheduler,
  SchedulerTelemetry,
  SchedulerCGroup
} from '../../core/scheduler/index.js';

describe('Scheduler Expansions', () => {
  describe('MLFQScheduler', () => {
    it('should schedule tasks and demote upon quantum exhaustion', () => {
      const mlfq = new MLFQScheduler([20, 40, 80]);
      mlfq.enqueue(101);

      const next1 = mlfq.selectNext();
      expect(next1?.pid).toBe(101);
      expect(next1?.level).toBe(0);

      // Consume full quantum -> demote to level 1
      mlfq.updateConsumption(101, 20);
      mlfq.enqueue(101);

      const next2 = mlfq.selectNext();
      expect(next2?.pid).toBe(101);
      expect(next2?.level).toBe(1);
      expect(next2?.quantumMs).toBe(40);
    });

    it('should boost all tasks back to level 0', () => {
      const mlfq = new MLFQScheduler([20, 40]);
      mlfq.enqueue(102);
      mlfq.updateConsumption(102, 20);
      mlfq.enqueue(102);

      expect(mlfq.getLevels()[1]?.queue).toContain(102);
      mlfq.boostAll();
      expect(mlfq.getLevels()[0]?.queue).toContain(102);
    });
  });

  describe('CFSScheduler', () => {
    it('should allocate virtual runtime proportional to nice weight', () => {
      const cfs = new CFSScheduler();
      cfs.addTask(201, 0);   // nice 0 (weight 1024)
      cfs.addTask(202, -10); // nice -10 (higher priority weight 9548)

      // Task 201 runs for 10ms
      cfs.recordExecution(201, 10);
      // Task 202 runs for 10ms
      cfs.recordExecution(202, 10);

      // Task 202 should have much lower vruntime due to high weight
      expect(cfs.getTask(202)!.vruntime).toBeLessThan(cfs.getTask(201)!.vruntime);

      // CFS selects task with lowest vruntime next
      expect(cfs.selectNext()?.pid).toBe(202);
    });
  });

  describe('RealTimeScheduler', () => {
    it('should prioritize higher RT priority tasks and rotate round-robin', () => {
      const rt = new RealTimeScheduler();
      rt.addRTTask(301, 50, 'SCHED_RR', 20);
      rt.addRTTask(302, 90, 'SCHED_RR', 20); // higher priority

      expect(rt.selectNext()?.pid).toBe(302);

      // Exhaust slice
      const result = rt.recordExecution(302, 20);
      expect(result.taskDoneSlice).toBe(true);
    });
  });

  describe('SchedulerTelemetry', () => {
    it('should record switches, CPU activity, and calculate utilization', () => {
      const telemetry = new SchedulerTelemetry();
      telemetry.recordContextSwitch();
      telemetry.recordContextSwitch();
      telemetry.recordCpuActivity(80, 20); // 80% utilization

      const snap = telemetry.getSnapshot(3);
      expect(snap.contextSwitches).toBe(2);
      expect(snap.cpuUtilizationPercent).toBe(80);
      expect(snap.activeTasksCount).toBe(3);
    });
  });

  describe('SchedulerCGroup', () => {
    it('should assign and track process cgroup limits', () => {
      const cgroup = new SchedulerCGroup();
      cgroup.createGroup('background_tasks', { cpuShares: 512, maxPids: 10 });

      expect(cgroup.assignPid('background_tasks', 401)).toBe(true);
      expect(cgroup.getGroupForPid(401)).toBe('background_tasks');
      expect(cgroup.getLimits('background_tasks')?.cpuShares).toBe(512);
    });
  });
});
