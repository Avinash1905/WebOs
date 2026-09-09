import { describe, expect, it } from 'vitest';
import {
  StructuredLogJournal,
  CrashDumpGenerator,
  PerformanceFlameTracer,
  KernelWatchdogMonitor,
} from '../../core/diagnostics/index.js';

describe('Diagnostics Deep Subsystems', () => {
  it('StructuredLogJournal records journal entries with monotonic timestamps and queries by fields', () => {
    const journal = new StructuredLogJournal();

    journal.log(3, 'Kernel panic averted', { SUBSYSTEM: 'kernel', MODULE: 'memory' });
    journal.log(6, 'User logged in', { SUBSYSTEM: 'auth', USER: 'alice' });
    journal.log(7, 'Debug trace', { SUBSYSTEM: 'network' });

    expect(journal.entries.length).toBe(3);
    expect(journal.entries[1]!.monotonicTimestamp).toBeGreaterThan(journal.entries[0]!.monotonicTimestamp);

    const errorEntries = journal.query({ priorityMax: 3 });
    expect(errorEntries.length).toBe(1);
    expect(errorEntries[0]!.message).toContain('Kernel panic');

    const authEntries = journal.query({ fieldMatch: { key: 'SUBSYSTEM', val: 'auth' } });
    expect(authEntries.length).toBe(1);
    expect(authEntries[0]!.fields['USER']).toBe('alice');
  });

  it('CrashDumpGenerator creates complete crash report with memory and stack traces', () => {
    const err = new Error('Out of bounds virtual memory access');
    const report = CrashDumpGenerator.generateReport(404, err, { allocatedBytes: 1048576, heapObjectsCount: 250 });

    expect(report.pid).toBe(404);
    expect(report.crashReason).toBe('Out of bounds virtual memory access');
    expect(report.callStack).toContain('Error');
    expect(report.memorySnapshot.allocatedBytes).toBe(1048576);
  });

  it('PerformanceFlameTracer aggregates execution samples into folded format for FlameGraphs', () => {
    const tracer = new PerformanceFlameTracer();

    tracer.recordStack(['root', 'kernel', 'scheduler', 'scheduleNext'], 5);
    tracer.recordStack(['root', 'kernel', 'scheduler', 'scheduleNext'], 3);
    tracer.recordStack(['root', 'vfs', 'readBlock'], 10);

    const output = tracer.exportFoldedFormat();
    expect(output).toContain('root;kernel;scheduler;scheduleNext 8');
    expect(output).toContain('root;vfs;readBlock 10');
  });

  it('KernelWatchdogMonitor tracks heartbeats and detects frozen threads', () => {
    const watchdog = new KernelWatchdogMonitor(2000);

    watchdog.ping('main_kernel_thread', 10000);
    watchdog.ping('worker_thread', 8000);

    const check1 = watchdog.checkHang(11000); // 11000 - 8000 = 3000 > 2000
    expect(check1.isHanging).toBe(true);
    expect(check1.hungThreads).toEqual(['worker_thread']);

    // Ping worker to clear hang
    watchdog.ping('worker_thread', 11500);
    const check2 = watchdog.checkHang(12000);
    expect(check2.isHanging).toBe(false);
  });
});
