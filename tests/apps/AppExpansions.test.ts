import { describe, it, expect } from 'vitest';
import {
  AppPackageValidator,
  AppSandboxEnvironment,
  MultiWindowManager,
  AppCrashRecovery
} from '../../core/apps/index.js';

describe('Application Runtime Expansions', () => {
  describe('AppPackageValidator', () => {
    it('should validate complete valid manifests and reject malformed manifests', () => {
      const valid = AppPackageValidator.validate({
        id: 'app.webos.calculator',
        name: 'Calculator',
        version: '1.0.0',
        main: 'index.js'
      });
      expect(valid.valid).toBe(true);

      const invalid = AppPackageValidator.validate({
        id: 'invalid-no-dot',
        name: '',
        version: 'bad_version',
        main: ''
      });
      expect(invalid.valid).toBe(false);
      expect(invalid.issues.length).toBeGreaterThan(1);
    });
  });

  describe('AppSandboxEnvironment', () => {
    it('should enforce storage quotas and isolated path restrictions', () => {
      const sandbox = new AppSandboxEnvironment({
        appId: 'app.webos.notes',
        isolatedPath: '/app_data/app.webos.notes',
        allowedPermissions: ['storage.read'],
        maxStorageBytes: 1024
      });

      expect(sandbox.hasPermission('storage.read')).toBe(true);
      expect(sandbox.hasPermission('camera')).toBe(false);
      expect(sandbox.checkPathAccess('/app_data/app.webos.notes/data.db')).toBe(true);
      expect(sandbox.checkPathAccess('/etc/shadow')).toBe(false);

      expect(sandbox.allocateStorage(512)).toBe(true);
      expect(sandbox.allocateStorage(600)).toBe(false); // exceeds 1024
      expect(sandbox.getStorageUsage().percentage).toBe(50);
    });
  });

  describe('MultiWindowManager', () => {
    it('should create, focus, cascade, and close multiple windows', () => {
      const wm = new MultiWindowManager();
      const w1 = wm.createWindow('app.webos.term', { title: 'Terminal 1' });
      const w2 = wm.createWindow('app.webos.editor', { title: 'Code Editor' });

      expect(wm.getFocusedWindow()?.windowId).toBe(w2.windowId);
      expect(w2.zIndex).toBeGreaterThan(w1.zIndex);

      wm.focusWindow(w1.windowId);
      expect(wm.getFocusedWindow()?.windowId).toBe(w1.windowId);

      wm.closeWindow(w1.windowId);
      expect(wm.getFocusedWindow()?.windowId).toBe(w2.windowId);
    });
  });

  describe('AppCrashRecovery', () => {
    it('should save state checkpoints and prevent crash loop storms', () => {
      const recovery = new AppCrashRecovery();
      recovery.saveCheckpoint('app.webos.calc', { display: '42' });
      expect(recovery.getCheckpoint('app.webos.calc')?.stateData).toEqual({ display: '42' });

      expect(recovery.recordCrash('app.webos.calc').canAutoRestart).toBe(true);
      expect(recovery.recordCrash('app.webos.calc').canAutoRestart).toBe(true);
      expect(recovery.recordCrash('app.webos.calc').canAutoRestart).toBe(true);
      expect(recovery.recordCrash('app.webos.calc').canAutoRestart).toBe(false); // 4th crash lockout
    });
  });
});
