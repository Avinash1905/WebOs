import { describe, expect, it } from 'vitest';
import {
  ProcessNamespaceManager,
  PtraceDebuggerInterface,
} from '../../core/process/index.js';

describe('Process Namespace and Ptrace Debugger', () => {
  it('ProcessNamespaceManager creates isolated PID/Mount/Net contexts and unshares', () => {
    const nsMgr = new ProcessNamespaceManager();

    const ns1 = nsMgr.createNamespace();
    nsMgr.assignProcessToNamespace(100, ns1);

    expect(nsMgr.getProcessNamespace(100)?.pidNamespaceId).toBe(ns1.pidNamespaceId);

    const unshared = nsMgr.unshare(100);
    expect(unshared.pidNamespaceId).not.toBe(ns1.pidNamespaceId);
  });

  it('PtraceDebuggerInterface attaches to tracee and reads/writes process memory', () => {
    const ptrace = new PtraceDebuggerInterface();

    expect(ptrace.attach(1000, 2000)).toBe(true);
    expect(ptrace.isTraced(2000)).toBe(true);

    ptrace.pokeText(2000, 0x400080, 0x9090); // NOP instruction
    expect(ptrace.peekText(2000, 0x400080)).toBe(0x9090);

    expect(ptrace.detach(2000)).toBe(true);
    expect(ptrace.isTraced(2000)).toBe(false);
  });
});
