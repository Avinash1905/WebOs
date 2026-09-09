import { describe, expect, it } from 'vitest';
import {
  ProcessEnvManager,
  ThreadSimulator,
  ProcessProfilingEngine,
  ProcessCgroupController,
} from '../../core/process/index.js';

describe('Process Deep Subsystems', () => {
  it('ProcessEnvManager manages env variables, sets, gets, and forks correctly', () => {
    const envMgr = new ProcessEnvManager();

    envMgr.setProcessEnv(100, { PATH: '/bin:/usr/bin', USER: 'root', LANG: 'en_US.UTF-8' });
    expect(envMgr.getEnv(100, 'USER')).toBe('root');

    envMgr.setEnv(100, 'DEBUG', '1');
    expect(envMgr.getEnv(100, 'DEBUG')).toBe('1');

    envMgr.forkEnv(100, 101);
    expect(envMgr.getEnv(101, 'USER')).toBe('root');
    expect(envMgr.getEnv(101, 'PPID')).toBe('100');
    expect(envMgr.getEnv(101, 'PID')).toBe('101');
  });

  it('ThreadSimulator creates threads, acquires mutex locks, and handles contention', () => {
    const threadSim = new ThreadSimulator();

    const t1 = threadSim.createThread(50, 'worker-1');
    const t2 = threadSim.createThread(50, 'worker-2');

    expect(threadSim.acquireMutex(t1.tid, 'db_lock')).toBe(true);
    expect(threadSim.acquireMutex(t2.tid, 'db_lock')).toBe(false); // Contention -> blocked
    expect(t2.state).toBe('BLOCKED');

    expect(threadSim.releaseMutex(t1.tid, 'db_lock')).toBe(true);
    expect(t2.state).toBe('READY'); // Unblocked

    expect(threadSim.acquireMutex(t2.tid, 'db_lock')).toBe(true);
    threadSim.terminateThread(t2.tid);
    expect(t2.state).toBe('TERMINATED');
  });

  it('ProcessProfilingEngine records execution samples and calculates flame trace reports', () => {
    const profiler = new ProcessProfilingEngine();

    profiler.recordSample(200, 'computeHash', 15, 1024);
    profiler.recordSample(200, 'computeHash', 20, 2048);
    profiler.recordSample(200, 'renderFrame', 45, 8192);

    const report = profiler.generateReport(200);
    expect(report.sampleCount).toBe(3);
    expect(report.totalExecutionTimeMs).toBe(80);
    expect(report.totalMemoryAllocatedBytes).toBe(11264);
    expect(report.topFunctions[0]!.functionName).toBe('renderFrame');
    expect(report.topFunctions[1]!.functionName).toBe('computeHash');
    expect(report.topFunctions[1]!.calls).toBe(2);
  });

  it('ProcessCgroupController manages hierarchy, pids limit, and OOM triggers', () => {
    const cgroup = new ProcessCgroupController();

    const appGroup = cgroup.createGroup('app_sandbox', {
      pidsMax: 2,
      memoryMaxBytes: 1000,
    });
    expect(appGroup.name).toBe('app_sandbox');

    expect(cgroup.attachProcess('app_sandbox', 301)).toBe(true);
    expect(cgroup.attachProcess('app_sandbox', 302)).toBe(true);
    expect(cgroup.attachProcess('app_sandbox', 303)).toBe(false); // Exceeds pidsMax (2)

    const memOk = cgroup.trackMemory('app_sandbox', 500);
    expect(memOk.allowed).toBe(true);
    expect(memOk.oomTriggered).toBe(false);

    const memOom = cgroup.trackMemory('app_sandbox', 600); // 500+600 = 1100 > 1000
    expect(memOom.allowed).toBe(false);
    expect(memOom.oomTriggered).toBe(true);
  });
});
