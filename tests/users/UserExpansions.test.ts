import { describe, it, expect } from 'vitest';
import {
  UserGroupManager,
  SessionLifecycleCoordinator,
  UserProfileProvisioner,
  UserManager
} from '../../core/users/index.js';
import { StorageEngine } from '../../core/storage/index.js';
import { FileSystem } from '../../core/filesystem/index.js';

describe('User Expansions', () => {
  describe('UserGroupManager', () => {
    it('should manage group creation and membership', () => {
      const mgr = new UserGroupManager();
      mgr.createGroup('engineering', 'Engineers');
      mgr.addUserToGroup('engineering', 'user123');

      expect(mgr.isUserInGroup('user123', 'engineering')).toBe(true);
      expect(mgr.getUserGroups('user123').some(g => g.name === 'engineering')).toBe(true);

      mgr.removeUserFromGroup('engineering', 'user123');
      expect(mgr.isUserInGroup('user123', 'engineering')).toBe(false);
    });
  });

  describe('SessionLifecycleCoordinator', () => {
    it('should track heartbeats and enforce concurrency limits', async () => {
      const storage = new StorageEngine({ adapter: 'memory' });
      await storage.initialize();
      const userMgr = new UserManager({ storage });
      await userMgr.initialize();

      const user = await userMgr.createUser({ username: 'sam' });
      await userMgr.createSession(user.id);
      await userMgr.createSession(user.id);
      await userMgr.createSession(user.id);

      const coordinator = new SessionLifecycleCoordinator(userMgr, { maxConcurrentSessionsPerUser: 2 });
      const closed = await coordinator.enforceConcurrencyLimit(user.id);
      expect(closed.length).toBe(1);

      const activeAfter = await userMgr.listSessions({ userId: user.id, status: 'ACTIVE' });
      expect(activeAfter.length).toBe(2);
    });
  });

  describe('UserProfileProvisioner', () => {
    it('should provision standard skeleton directories and dotfiles', async () => {
      const storage = new StorageEngine({ adapter: 'memory' });
      await storage.initialize();
      const fs = new FileSystem({ storage });
      await fs.initialize();

      const provisioner = new UserProfileProvisioner(fs);
      const created = await provisioner.provisionSkeleton('jdoe');

      expect(created.length).toBeGreaterThan(0);
      expect(await fs.exists('/home/jdoe/Desktop')).toBe(true);
      expect(await fs.exists('/home/jdoe/Documents')).toBe(true);
      expect(await fs.exists('/home/jdoe/.bashrc')).toBe(true);
    });
  });
});
