import { describe, it, expect } from 'vitest';
import {
  DeviceDriverRegistry,
  InterruptController,
  SystemCallTable,
  PowerManagement,
  KernelModuleLoader,
  VirtualMemoryManager,
  KernelSpinlock,
  KernelRWLock
} from '../../core/kernel/index.js';

describe('Kernel Deep Subsystems', () => {
  describe('DeviceDriverRegistry', () => {
    it('should read from /dev/zero and write to /dev/null', async () => {
      const reg = new DeviceDriverRegistry();
      const zeros = await reg.readDevice('zero', 0, 16);
      expect(zeros.length).toBe(16);
      expect(zeros.every(b => b === 0)).toBe(true);

      const written = await reg.writeDevice('null', 0, new Uint8Array([1, 2, 3]));
      expect(written).toBe(3);
    });
  });

  describe('InterruptController', () => {
    it('should route and execute registered IRQs', async () => {
      const ic = new InterruptController();
      let irqFired = false;

      ic.registerIRQ(1, 'KEYBOARD', 'HIGH', () => {
        irqFired = true;
      });

      ic.triggerIRQ(1);
      await ic.processPending();
      expect(irqFired).toBe(true);
    });
  });

  describe('SystemCallTable', () => {
    it('should dispatch system calls and enforce privileges', async () => {
      const sysTable = new SystemCallTable();
      sysTable.registerSyscall(1, 'sys_exit', 1, (args) => `Exit code: ${args[0]}`);
      sysTable.registerSyscall(2, 'sys_reboot', 0, () => 'Rebooting', true);

      const res = await sysTable.dispatch(1, [0]);
      expect(res).toBe('Exit code: 0');

      await expect(sysTable.dispatch(2, [], { userId: 'u1', role: 'USER' })).rejects.toThrow();
      const adminRes = await sysTable.dispatch(2, [], { userId: 'admin', role: 'ADMIN' });
      expect(adminRes).toBe('Rebooting');
    });
  });

  describe('PowerManagement', () => {
    it('should track power states and wake locks', async () => {
      const pm = new PowerManagement();
      const lock = pm.acquireWakeLock('video_playback');

      const sleepAttempt = await pm.transitionTo('S3_SUSPEND');
      expect(sleepAttempt).toBe(false); // blocked by wakelock

      pm.releaseWakeLock(lock.id);
      const sleepSuccess = await pm.transitionTo('S3_SUSPEND');
      expect(sleepSuccess).toBe(true);
    });
  });

  describe('KernelModuleLoader', () => {
    it('should load and clean up kernel modules', async () => {
      const loader = new KernelModuleLoader();
      let initialized = false;

      await loader.insertModule({
        name: 'virtio_net',
        version: '1.0.0',
        author: 'WebOS Core',
        description: 'Virtual Network Driver',
        init: () => { initialized = true; },
        cleanup: () => { initialized = false; }
      });

      expect(initialized).toBe(true);
      expect(loader.listModules().some(m => m.name === 'virtio_net')).toBe(true);

      await loader.removeModule('virtio_net');
      expect(initialized).toBe(false);
    });
  });

  describe('VirtualMemoryManager', () => {
    it('should allocate 4KB pages and read/write virtual memory', () => {
      const vmm = new VirtualMemoryManager();
      const addr = vmm.allocatePages(2); // 8KB
      expect(addr).toBe(0);

      const data = new TextEncoder().encode('Virtual Memory in TypeScript');
      vmm.writeMemory(addr, data);

      const readBack = vmm.readMemory(addr, data.length);
      expect(new TextDecoder().decode(readBack)).toBe('Virtual Memory in TypeScript');

      vmm.freePages(addr, 2);
    });
  });

  describe('KernelSpinlock & KernelRWLock', () => {
    it('should synchronize critical sections', async () => {
      const spinlock = new KernelSpinlock();
      expect(spinlock.tryLock()).toBe(true);
      expect(spinlock.tryLock()).toBe(false);
      spinlock.release();
      expect(spinlock.isLocked()).toBe(false);

      const rwlock = new KernelRWLock();
      await rwlock.acquireRead();
      rwlock.releaseRead();
      await rwlock.acquireWrite();
      rwlock.releaseWrite();
    });
  });
});
