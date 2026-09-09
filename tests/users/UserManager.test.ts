import { describe, expect, it } from 'vitest';
import { EventBus } from '../../core/events/index.js';
import { FileSystem } from '../../core/filesystem/index.js';
import { StorageEngine } from '../../core/storage/index.js';
import {
  InvalidUsernameError,
  ProtectedUserError,
  RoleManager,
  USER_ROLES,
  UserAlreadyExistsError,
  UserManager,
} from '../../core/users/index.js';

describe('Local User & Session System', () => {
  describe('User Management', () => {
    it('initializes default users on first startup', async () => {
      const storage = new StorageEngine({ adapter: 'memory' });
      const userManager = new UserManager({ storage });
      await userManager.initialize();

      const admin = await userManager.getUserByUsername('admin');
      expect(admin).not.toBeNull();
      expect(admin?.role).toBe(USER_ROLES.ADMIN);
      expect(admin?.isProtected).toBe(true);

      const user = await userManager.getUserByUsername('user');
      expect(user).not.toBeNull();
      expect(user?.role).toBe(USER_ROLES.USER);

      const guest = await userManager.getUserByUsername('guest');
      expect(guest).not.toBeNull();
      expect(guest?.role).toBe(USER_ROLES.GUEST);
    });

    it('creates a new user and provisions home directory when VFS is attached', async () => {
      const storage = new StorageEngine({ adapter: 'memory' });
      const fs = new FileSystem({ storage });
      await fs.initialize();

      const userManager = new UserManager({ storage, fileSystem: fs });
      await userManager.initialize();

      const alice = await userManager.createUser({
        username: 'alice',
        displayName: 'Alice Wonderland',
        role: USER_ROLES.USER,
        preferences: { theme: 'cyberpunk' },
      });

      expect(alice.id).toBeDefined();
      expect(alice.username).toBe('alice');
      expect(alice.displayName).toBe('Alice Wonderland');
      expect(alice.homeDirectory).toBe('/home/alice');
      expect(alice.preferences.theme).toBe('cyberpunk');

      // Verify VFS home directory and standard subdirectories
      expect(await fs.exists('/home/alice')).toBe(true);
      expect(await fs.exists('/home/alice/Desktop')).toBe(true);
      expect(await fs.exists('/home/alice/Documents')).toBe(true);
      expect(await fs.exists('/home/alice/Downloads')).toBe(true);
      expect(await fs.exists('/home/alice/Pictures')).toBe(true);
      expect(await fs.exists('/home/alice/Music')).toBe(true);
    });

    it('rejects duplicate usernames and invalid username characters', async () => {
      const storage = new StorageEngine({ adapter: 'memory' });
      const userManager = new UserManager({ storage });
      await userManager.initialize();

      await userManager.createUser({ username: 'bob' });

      await expect(userManager.createUser({ username: 'bob' })).rejects.toThrow(
        UserAlreadyExistsError
      );
      await expect(userManager.createUser({ username: 'BOB' })).rejects.toThrow(
        UserAlreadyExistsError
      );

      // Invalid characters
      await expect(userManager.createUser({ username: 'b@b!' })).rejects.toThrow(
        InvalidUsernameError
      );
      await expect(userManager.createUser({ username: 'a' })).rejects.toThrow(
        InvalidUsernameError
      );
    });

    it('updates user display name, role, and preferences', async () => {
      const storage = new StorageEngine({ adapter: 'memory' });
      const userManager = new UserManager({ storage });
      await userManager.initialize();

      const charlie = await userManager.createUser({ username: 'charlie' });

      const updated = await userManager.updateUser(charlie.id, {
        displayName: 'Charlie Chaplin',
        role: USER_ROLES.ADMIN,
        preferences: { wallpaper: 'sunset.jpg' },
      });

      expect(updated.displayName).toBe('Charlie Chaplin');
      expect(updated.role).toBe(USER_ROLES.ADMIN);
      expect(updated.preferences.wallpaper).toBe('sunset.jpg');

      const fetched = await userManager.getUser(charlie.id);
      expect(fetched?.displayName).toBe('Charlie Chaplin');
    });

    it('protects system accounts from accidental deletion', async () => {
      const storage = new StorageEngine({ adapter: 'memory' });
      const userManager = new UserManager({ storage });
      await userManager.initialize();

      const admin = await userManager.getUserByUsername('admin');
      expect(admin).not.toBeNull();

      // Normal delete should fail
      await expect(userManager.deleteUser(admin!.id)).rejects.toThrow(
        ProtectedUserError
      );

      // Force delete should succeed
      await userManager.deleteUser(admin!.id, { force: true });
      expect(await userManager.getUser(admin!.id)).toBeNull();
    });
  });

  describe('Session Management', () => {
    it('creates active sessions and tracks current active user', async () => {
      const storage = new StorageEngine({ adapter: 'memory' });
      const userManager = new UserManager({ storage });
      await userManager.initialize();

      const dave = await userManager.createUser({ username: 'dave' });
      const session = await userManager.createSession(dave.id);

      expect(session.sessionId).toBeDefined();
      expect(session.userId).toBe(dave.id);
      expect(session.status).toBe('ACTIVE');

      const currentSession = userManager.getCurrentSession();
      expect(currentSession?.sessionId).toBe(session.sessionId);

      const currentUser = userManager.getCurrentUser();
      expect(currentUser?.username).toBe('dave');
    });

    it('switches users and ends sessions gracefully', async () => {
      const storage = new StorageEngine({ adapter: 'memory' });
      const userManager = new UserManager({ storage });
      await userManager.initialize();

      const eve = await userManager.createUser({ username: 'eve' });
      const frank = await userManager.createUser({ username: 'frank' });

      await userManager.createSession(eve.id);
      expect(userManager.getCurrentUser()?.username).toBe('eve');

      const sessionFrank = await userManager.switchUser(frank.id);
      expect(userManager.getCurrentUser()?.username).toBe('frank');

      await userManager.endSession(sessionFrank.sessionId);
      expect(userManager.getCurrentSession()?.status).not.toBe('ACTIVE');
    });

    it('emits lifecycle events through EventBus', async () => {
      const eventBus = new EventBus();
      const storage = new StorageEngine({ adapter: 'memory', eventBus });
      const userManager = new UserManager({ storage, eventBus });
      await userManager.initialize();

      const events: string[] = [];
      eventBus.subscribe('USER_CREATED', (p) => {
        events.push(`created:${p.username}`);
      });
      eventBus.subscribe('USER_LOGIN', (p) => {
        events.push(`login:${p.username}`);
      });
      eventBus.subscribe('SESSION_ENDED', (p) => {
        events.push(`session_ended:${p.sessionId}`);
      });

      const grace = await userManager.createUser({ username: 'grace' });
      const session = await userManager.createSession(grace.id);
      await userManager.endSession(session.sessionId);

      expect(events).toContain('created:grace');
      expect(events).toContain('login:grace');
      expect(events).toContain(`session_ended:${session.sessionId}`);
    });
  });

  describe('RoleManager Helper', () => {
    it('verifies role hierarchy and permissions', () => {
      expect(RoleManager.isAdmin('ADMIN')).toBe(true);
      expect(RoleManager.isAdmin('USER')).toBe(false);
      expect(RoleManager.isGuest('GUEST')).toBe(true);
      expect(RoleManager.canModify('ADMIN', 'USER')).toBe(true);
      expect(RoleManager.canModify('USER', 'ADMIN')).toBe(false);
    });
  });
});
