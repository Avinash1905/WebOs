import { describe, expect, it } from 'vitest';
import { EventBus } from '../../core/events/index.js';
import {
  DEFAULT_MODES,
  PermissionDeniedError,
  PermissionManager,
  UnauthorizedOperationError,
} from '../../core/permissions/index.js';
import { StorageEngine } from '../../core/storage/index.js';

describe('Permission & Security Engine', () => {
  describe('POSIX Mode & Ownership Access', () => {
    it('grants read/write access to resource owner in default file mode', async () => {
      const storage = new StorageEngine({ adapter: 'memory' });
      const permManager = new PermissionManager({ storage });
      await permManager.initialize();

      const target = {
        id: 'node_1',
        path: '/home/alice/doc.txt',
        ownerId: 'user_alice',
        mode: DEFAULT_MODES.FILE, // 0o644 (rw-r--r--)
        isDirectory: false,
      };

      // Owner read & write
      expect(
        await permManager.hasPermission({ userId: 'user_alice' }, target, 'READ')
      ).toBe(true);
      expect(
        await permManager.hasPermission({ userId: 'user_alice' }, target, 'WRITE')
      ).toBe(true);

      // Non-owner read is allowed, write is denied
      expect(
        await permManager.hasPermission({ userId: 'user_bob' }, target, 'READ')
      ).toBe(true);
      expect(
        await permManager.hasPermission({ userId: 'user_bob' }, target, 'WRITE')
      ).toBe(false);
    });

    it('enforces private file mode (0o600)', async () => {
      const storage = new StorageEngine({ adapter: 'memory' });
      const permManager = new PermissionManager({ storage });
      await permManager.initialize();

      const target = {
        id: 'node_secret',
        path: '/home/alice/secret.key',
        ownerId: 'user_alice',
        mode: DEFAULT_MODES.PRIVATE_FILE, // 0o600 (rw-------)
        isDirectory: false,
      };

      // Owner has full access
      expect(
        await permManager.hasPermission({ userId: 'user_alice' }, target, 'READ')
      ).toBe(true);
      expect(
        await permManager.hasPermission({ userId: 'user_alice' }, target, 'WRITE')
      ).toBe(true);

      // Other users denied completely
      expect(
        await permManager.hasPermission({ userId: 'user_bob' }, target, 'READ')
      ).toBe(false);
      expect(
        await permManager.hasPermission({ userId: 'user_bob' }, target, 'WRITE')
      ).toBe(false);
    });

    it('assertPermission throws PermissionDeniedError when access is denied', async () => {
      const storage = new StorageEngine({ adapter: 'memory' });
      const permManager = new PermissionManager({ storage });
      await permManager.initialize();

      const target = {
        id: 'node_secret',
        path: '/home/alice/secret.key',
        ownerId: 'user_alice',
        mode: 0o600,
        isDirectory: false,
      };

      await expect(
        permManager.assertPermission({ userId: 'user_bob' }, target, 'READ')
      ).rejects.toThrow(PermissionDeniedError);
    });
  });

  describe('Administrator & System Privileges', () => {
    it('allows administrators and internal system context full access to all resources', async () => {
      const storage = new StorageEngine({ adapter: 'memory' });
      const permManager = new PermissionManager({ storage });
      await permManager.initialize();

      const target = {
        id: 'node_locked',
        path: '/home/alice/private.txt',
        ownerId: 'user_alice',
        mode: 0o000, // No permissions for anyone in POSIX
        isDirectory: false,
      };

      // Admin role bypasses POSIX restrictions
      expect(
        await permManager.hasPermission(
          { userId: 'admin_1', role: 'ADMIN' },
          target,
          'READ'
        )
      ).toBe(true);

      // Internal system context bypasses restrictions
      expect(
        await permManager.hasPermission(
          { isSystem: true },
          target,
          'WRITE'
        )
      ).toBe(true);
    });
  });

  describe('System Path Protection Policies', () => {
    it('protects /system, /bin, /etc, /applications from non-admin modifications', async () => {
      const storage = new StorageEngine({ adapter: 'memory' });
      const permManager = new PermissionManager({ storage });
      await permManager.initialize();

      const sysTarget = {
        path: '/system/kernel_config.json',
        isDirectory: false,
      };

      // Non-admin can read system files
      expect(
        await permManager.hasPermission(
          { userId: 'user_alice', role: 'USER' },
          sysTarget,
          'READ'
        )
      ).toBe(true);

      // Non-admin cannot write/modify system files
      expect(
        await permManager.hasPermission(
          { userId: 'user_alice', role: 'USER' },
          sysTarget,
          'WRITE'
        )
      ).toBe(false);

      // Admin can modify system files
      expect(
        await permManager.hasPermission(
          { userId: 'user_admin', role: 'ADMIN' },
          sysTarget,
          'WRITE'
        )
      ).toBe(true);
    });
  });

  describe('Custom ACLs & Ownership Management', () => {
    it('grants and revokes explicit per-user ACL permissions', async () => {
      const eventBus = new EventBus();
      const storage = new StorageEngine({ adapter: 'memory', eventBus });
      const permManager = new PermissionManager({ storage, eventBus });
      await permManager.initialize();

      const emitted: string[] = [];
      eventBus.subscribe('PERMISSION_GRANTED', (p) => {
        emitted.push(`granted:${p.grantedTo}:${p.permission}`);
      });
      eventBus.subscribe('PERMISSION_REVOKED', (p) => {
        emitted.push(`revoked:${p.revokedFrom}:${p.permission}`);
      });

      const target = {
        id: 'node_project',
        path: '/home/alice/project.ts',
        ownerId: 'user_alice',
        mode: 0o600, // Private to alice
      };

      // Initially Bob is denied
      expect(
        await permManager.hasPermission({ userId: 'user_bob' }, target, 'READ')
      ).toBe(false);

      // Alice grants Bob READ and WRITE access
      await permManager.grantPermission(
        'node_project',
        'user_bob',
        ['READ', 'WRITE'],
        { userId: 'user_alice' }
      );

      expect(emitted).toContain('granted:user_bob:READ');
      expect(emitted).toContain('granted:user_bob:WRITE');

      // Now Bob has access via ACL
      expect(
        await permManager.hasPermission({ userId: 'user_bob' }, target, 'READ')
      ).toBe(true);
      expect(
        await permManager.hasPermission({ userId: 'user_bob' }, target, 'WRITE')
      ).toBe(true);

      // Alice revokes WRITE access from Bob
      await permManager.revokePermission(
        'node_project',
        'user_bob',
        ['WRITE'],
        { userId: 'user_alice' }
      );

      expect(emitted).toContain('revoked:user_bob:WRITE');
      expect(
        await permManager.hasPermission({ userId: 'user_bob' }, target, 'READ')
      ).toBe(true);
      expect(
        await permManager.hasPermission({ userId: 'user_bob' }, target, 'WRITE')
      ).toBe(false);
    });

    it('prevents non-owners from granting permissions', async () => {
      const storage = new StorageEngine({ adapter: 'memory' });
      const permManager = new PermissionManager({ storage });
      await permManager.initialize();

      await permManager.setNodePermissions('node_test', {
        ownerId: 'user_alice',
        mode: 0o600,
      }, { isSystem: true });

      // Charlie (stranger) tries to grant Bob access
      await expect(
        permManager.grantPermission('node_test', 'user_bob', ['READ'], {
          userId: 'user_charlie',
          role: 'USER',
        })
      ).rejects.toThrow(UnauthorizedOperationError);
    });
  });
});
