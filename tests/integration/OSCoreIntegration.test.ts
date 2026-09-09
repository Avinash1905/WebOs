import { describe, expect, it } from 'vitest';
import { EventBus } from '../../core/events/index.js';
import { FileSystem } from '../../core/filesystem/index.js';
import { Kernel } from '../../core/kernel/index.js';
import {
  DEFAULT_MODES,
  PermissionDeniedError,
  PermissionManager,
} from '../../core/permissions/index.js';
import { ProcessManager } from '../../core/process/index.js';
import { StorageEngine } from '../../core/storage/index.js';
import { TrashManager } from '../../core/trash/index.js';
import { USER_ROLES, UserManager } from '../../core/users/index.js';

describe('OS Core Combined Integration (Kernel + Events + Storage + Users + Permissions + VFS + Trash + Processes)', () => {
  it('boots full OS core runtime with all services in topological order', async () => {
    const kernel = new Kernel();
    const eventBus = new EventBus();
    const storage = new StorageEngine({ adapter: 'memory', eventBus });
    const userManager = new UserManager({ storage, eventBus });
    const permissionManager = new PermissionManager({ storage, eventBus, userManager });
    const fs = new FileSystem({ storage, eventBus, permissionManager, userManager });
    const trashManager = new TrashManager({ storage, eventBus, fileSystem: fs });
    const processManager = new ProcessManager({
      eventBus,
      userManager,
      permissionManager,
      fileSystem: fs,
    });

    // Cross-wire optional dependencies
    userManager.attachFileSystem(fs);
    fs.attachTrashManager(trashManager);

    // Register all services with Kernel
    kernel.registerService(eventBus);
    kernel.registerService(storage);
    kernel.registerService(userManager);
    kernel.registerService(permissionManager);
    kernel.registerService(fs);
    kernel.registerService(trashManager);
    kernel.registerService(processManager);

    eventBus.attachToKernel(kernel);

    // Initialize and start OS runtime
    await kernel.initialize();
    await kernel.start();

    expect(kernel.getStatus()).toBe('RUNNING');
    expect(kernel.getService('users')?.getStatus()).toBe('RUNNING');
    expect(kernel.getService('permissions')?.getStatus()).toBe('RUNNING');
    expect(kernel.getService('filesystem')?.getStatus()).toBe('RUNNING');
    expect(kernel.getService('trash')?.getStatus()).toBe('RUNNING');
    expect(kernel.getService('process-manager')?.getStatus()).toBe('RUNNING');

    await kernel.stop();
    expect(kernel.getStatus()).toBe('STOPPED');
  });

  describe('User -> Permissions -> VFS End-to-End Flow', () => {
    it('provisions user home directory and enforces multi-user file isolation', async () => {
      const storage = new StorageEngine({ adapter: 'memory' });
      const fs = new FileSystem({ storage });
      const userManager = new UserManager({ storage, fileSystem: fs });
      const permManager = new PermissionManager({ storage, userManager });

      fs.attachPermissionManager(permManager);
      fs.attachUserManager(userManager);

      await fs.initialize();
      await userManager.initialize();
      await permManager.initialize();

      // 1. Create Alice and Bob
      const alice = await userManager.createUser({
        username: 'alice',
        role: USER_ROLES.USER,
      });

      const bob = await userManager.createUser({
        username: 'bob',
        role: USER_ROLES.USER,
      });

      // Verify home directories exist
      expect(await fs.exists('/home/alice/Documents')).toBe(true);
      expect(await fs.exists('/home/bob/Documents')).toBe(true);

      // 2. Alice logs in and creates a private file
      await userManager.switchUser(alice.id);
      const privateFile = await fs.createFile('/home/alice/Documents/diary.txt', {
        content: 'Alice confidential diary entry',
        mode: DEFAULT_MODES.PRIVATE_FILE, // 0o600 (owner only)
      });

      expect(privateFile.ownerId).toBe(alice.id);

      // 3. Bob logs in and tries to read Alice's private file -> DENIED
      await userManager.switchUser(bob.id);
      await expect(
        fs.readFile('/home/alice/Documents/diary.txt')
      ).rejects.toThrow(PermissionDeniedError);

      // Bob tries to write to Alice's directory -> DENIED
      await expect(
        fs.createFile('/home/alice/Documents/bob_hack.txt', { content: 'hacked' })
      ).rejects.toThrow(PermissionDeniedError);

      // 4. Alice creates a public file (0o644)
      await userManager.switchUser(alice.id);
      await fs.createFile('/home/alice/Documents/public_note.txt', {
        content: 'Public announcement',
        mode: DEFAULT_MODES.FILE, // 0o644 (read for all)
      });

      // Bob can read Alice's public file
      await userManager.switchUser(bob.id);
      const publicContent = await fs.readFile('/home/alice/Documents/public_note.txt');
      expect(publicContent).toBe('Public announcement');
    });
  });

  describe('User -> Process -> Security Boundaries', () => {
    it('binds process execution to active user session and protects process control', async () => {
      const storage = new StorageEngine({ adapter: 'memory' });
      const fs = new FileSystem({ storage });
      const userManager = new UserManager({ storage, fileSystem: fs });
      const permManager = new PermissionManager({ storage, userManager });
      const procManager = new ProcessManager({
        userManager,
        permissionManager: permManager,
        fileSystem: fs,
      });

      await fs.initialize();
      await userManager.initialize();
      await permManager.initialize();
      await procManager.initialize();

      const alice = await userManager.createUser({ username: 'alice' });
      const bob = await userManager.createUser({ username: 'bob' });

      // Alice logs in and spawns a background process
      await userManager.switchUser(alice.id);
      const aliceProcess = await procManager.createProcess({
        name: 'AliceTask',
        autoStart: true,
      });

      expect(aliceProcess.userId).toBe(alice.id);
      expect(aliceProcess.cwd).toBe('/home/alice');

      // Bob logs in and tries to pause or terminate Alice's process -> DENIED
      await userManager.switchUser(bob.id);
      await expect(
        procManager.pauseProcess(aliceProcess.pid)
      ).rejects.toThrow();

      await expect(
        procManager.terminateProcess(aliceProcess.pid)
      ).rejects.toThrow();

      // Admin logs in and can manage Alice's process
      const admin = await userManager.getUserByUsername('admin');
      await userManager.switchUser(admin!.id);

      const stoppedByAdmin = await procManager.terminateProcess(aliceProcess.pid);
      expect(stoppedByAdmin.state).toBe('TERMINATED');
    });
  });

  describe('VFS -> Trash -> Recovery Round-Trip', () => {
    it('deletes to trash, recovers file to original location, and reads back content', async () => {
      const storage = new StorageEngine({ adapter: 'memory' });
      const fs = new FileSystem({ storage });
      const trashManager = new TrashManager({ storage, fileSystem: fs });
      fs.attachTrashManager(trashManager);

      await fs.initialize();
      await trashManager.initialize();

      // Create file in VFS
      await fs.createFile('/home/user/Documents/project_plan.md', {
        content: '# WebOS OS Core Plan\nEverything integrated seamlessly.',
      });

      expect(await fs.exists('/home/user/Documents/project_plan.md')).toBe(true);

      // Normal delete via VFS sends to Trash
      await fs.delete('/home/user/Documents/project_plan.md', { useTrash: true });

      expect(await fs.exists('/home/user/Documents/project_plan.md')).toBe(false);

      const trashedItems = await trashManager.listTrash();
      expect(trashedItems.length).toBe(1);
      const firstTrash = trashedItems[0];
      expect(firstTrash).toBeDefined();
      expect(firstTrash?.originalPath).toBe('/home/user/Documents/project_plan.md');

      // Restore file from Trash
      const restored = await trashManager.restore(firstTrash!.trashId);
      expect(restored.path).toBe('/home/user/Documents/project_plan.md');

      expect(await fs.exists('/home/user/Documents/project_plan.md')).toBe(true);
      const restoredContent = await fs.readFile('/home/user/Documents/project_plan.md');
      expect(restoredContent).toContain('# WebOS OS Core Plan');
    });
  });
});
