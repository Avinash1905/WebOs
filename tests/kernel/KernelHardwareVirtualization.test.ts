import { describe, expect, it } from 'vitest';
import {
  VirtioPciController,
  ACPIPowerEngine,
  KernelTrapTable,
  EfiBootServices,
  SmpCoreBarrier,
} from '../../core/kernel/index.js';

describe('Kernel Hardware Virtualization Subsystems', () => {
  it('VirtioPciController manages virtual queues, descriptor pushing and buffer completion', () => {
    const virtio = new VirtioPciController();
    const q = virtio.initQueue(0, 64);

    expect(q.size).toBe(64);
    virtio.pushAvailDescriptor(0, 5);
    virtio.pushAvailDescriptor(0, 8);

    const desc1 = virtio.popAvailDescriptor(0);
    expect(desc1).toBe(5);

    virtio.completeBuffer(0, 5, 1024);
    expect(q.usedRing.length).toBe(1);
    expect(q.usedRing[0]!.len).toBe(1024);
  });

  it('ACPIPowerEngine handles global sleep states and per-device power state management', () => {
    const acpi = new ACPIPowerEngine();

    acpi.setDevicePower('pci_nic', 'D0_FULLY_ON');
    expect(acpi.getDevicePower('pci_nic')).toBe('D0_FULLY_ON');

    acpi.transitionGlobalState('G2_SOFT_OFF');
    expect(acpi.globalState).toBe('G2_SOFT_OFF');
    expect(acpi.getDevicePower('pci_nic')).toBe('D3_POWER_OFF');
  });

  it('KernelTrapTable registers trap handlers and dispatches CPU faults', () => {
    const table = new KernelTrapTable();
    let handledVector = -1;

    table.registerTrapHandler(14, (frame) => {
      handledVector = frame.vector;
    });

    const dispatched = table.dispatchTrap({
      vector: 14,
      trapName: '#PF Page Fault',
      errorCode: 2,
      rip: 0x80004000,
      rsp: 0x7fffffff000,
      cr2: 0x00000000,
    });

    expect(dispatched).toBe(true);
    expect(handledVector).toBe(14);
    expect(table.getHistory().length).toBe(1);
  });

  it('EfiBootServices manages NVRAM variables and memory map descriptors', () => {
    const efi = new EfiBootServices();

    efi.setVariable('BootOrder', '0001,0002');
    expect(efi.getVariable('BootOrder')).toBe('0001,0002');

    expect(efi.isExited).toBe(false);
    expect(efi.exitBootServices()).toBe(true);
    expect(efi.isExited).toBe(true);
  });

  it('SmpCoreBarrier synchronizes cores across generations with designated leader', () => {
    const barrier = new SmpCoreBarrier(3);

    const r1 = barrier.arriveAndWait();
    expect(r1.isLeader).toBe(false);

    const r2 = barrier.arriveAndWait();
    expect(r2.isLeader).toBe(false);

    const r3 = barrier.arriveAndWait();
    expect(r3.isLeader).toBe(true); // 3rd core is the leader
    expect(barrier.generation).toBe(1);
  });
});
