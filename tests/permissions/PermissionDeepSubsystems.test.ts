import { describe, expect, it } from 'vitest';
import {
  CapabilityEngine,
  POSIXCapability,
  SELinuxPolicy,
  SecurityAuditPolicy,
  SandboxIsolationEngine,
} from '../../core/permissions/index.js';

describe('Permissions Deep Subsystems', () => {
  it('CapabilityEngine properly initializes, drops, raises, and checks POSIX capabilities', () => {
    const engine = new CapabilityEngine();
    const pid = 101;

    engine.initProcess(pid, true); // root process
    expect(engine.hasCapability(pid, POSIXCapability.CAP_SYS_ADMIN)).toBe(true);

    engine.dropCapability(pid, POSIXCapability.CAP_SYS_ADMIN);
    expect(engine.hasCapability(pid, POSIXCapability.CAP_SYS_ADMIN)).toBe(false);

    // Can raise permitted capability back
    expect(engine.raiseCapability(pid, POSIXCapability.CAP_SYS_ADMIN)).toBe(true);
    expect(engine.hasCapability(pid, POSIXCapability.CAP_SYS_ADMIN)).toBe(true);

    // Fork preserves bounding and effective
    const childCaps = engine.forkCapabilities(pid, 102);
    expect(childCaps.effective).toBeGreaterThan(0);
    expect(engine.hasCapability(102, POSIXCapability.CAP_SYS_ADMIN)).toBe(true);
  });

  it('SELinuxPolicy enforces mandatory access controls and caches AVC decisions', () => {
    const selinux = new SELinuxPolicy();

    const src = selinux.parseContext('system_u:system_r:kernel_t:s0');
    const target = selinux.parseContext('system_u:object_r:system_data_t:s0');

    expect(selinux.checkAccess(src, target, 'file', 'read')).toBe(true);
    expect(selinux.checkAccess(src, target, 'file', 'write')).toBe(true);

    // Unauthorized access check
    const unauthSrc = selinux.parseContext('user_u:user_r:guest_t:s0');
    expect(selinux.checkAccess(unauthSrc, target, 'file', 'write')).toBe(false);

    // Test permissive mode
    selinux.setMode('PERMISSIVE');
    expect(selinux.checkAccess(unauthSrc, target, 'file', 'write')).toBe(true);
  });

  it('SecurityAuditPolicy records events and notifies subscribers', () => {
    const audit = new SecurityAuditPolicy();
    const events: any[] = [];

    const unsubscribe = audit.onAudit((rec) => events.push(rec));

    audit.logEvent('INFO', 'user1', 'login', '/sys/auth', 'GRANTED');
    audit.logEvent('ALERT', 'guest', 'write', '/etc/shadow', 'DENIED', 'Permission denied');

    expect(events.length).toBe(2);
    expect(audit.getDeniedEvents().length).toBe(1);
    expect(audit.getDeniedEvents()[0]!.subject).toBe('guest');

    unsubscribe();
    audit.logEvent('INFO', 'user2', 'logout', '/sys/auth', 'GRANTED');
    expect(events.length).toBe(2); // no new events delivered after unsub
  });

  it('SandboxIsolationEngine enforces path whitelisting and resource boundaries', () => {
    const sandbox = new SandboxIsolationEngine();

    sandbox.createSandbox({
      appId: 'app_editor',
      allowedPaths: ['/home/user/documents'],
      readOnlyPaths: ['/usr/share/fonts'],
      allowNetwork: false,
      allowClipboard: true,
      allowNotifications: true,
      maxMemoryMB: 128,
    });

    expect(sandbox.checkPathAccess('app_editor', '/home/user/documents/file.txt', true)).toBe(true);
    expect(sandbox.checkPathAccess('app_editor', '/usr/share/fonts/roboto.ttf', false)).toBe(true);
    expect(sandbox.checkPathAccess('app_editor', '/usr/share/fonts/roboto.ttf', true)).toBe(false); // cannot write to RO
    expect(sandbox.checkPathAccess('app_editor', '/etc/passwd', false)).toBe(false);

    expect(sandbox.checkNetworkAccess('app_editor')).toBe(false);
    expect(sandbox.checkClipboardAccess('app_editor')).toBe(true);
  });
});
