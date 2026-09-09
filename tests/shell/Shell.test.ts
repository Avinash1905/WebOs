import { describe, expect, it } from 'vitest';
import { FileSystem } from '../../core/filesystem/index.js';
import { DEFAULT_MODES, PermissionManager } from '../../core/permissions/index.js';
import { ProcessManager } from '../../core/process/index.js';
import { Scheduler } from '../../core/scheduler/index.js';
import { Shell } from '../../core/shell/index.js';
import { StorageEngine } from '../../core/storage/index.js';
import { UserManager, USER_ROLES } from '../../core/users/index.js';

describe('Shell / Terminal Engine', () => {
  it('initializes and executes built-in system commands', async () => {
    const storage = new StorageEngine({ adapter: 'memory' });
    const userManager = new UserManager({ storage });
    const permManager = new PermissionManager({ storage, userManager });
    const fs = new FileSystem({ storage, permissionManager: permManager, userManager });
    const procManager = new ProcessManager({ userManager, permissionManager: permManager, fileSystem: fs });

    userManager.attachFileSystem(fs);
    await fs.initialize();
    await userManager.initialize();
    await permManager.initialize();
    await procManager.initialize();

    const shell = new Shell({
      fileSystem: fs,
      permissionManager: permManager,
      userManager,
      processManager: procManager,
    });
    await shell.initialize();
    await shell.start();

    // 1. echo
    const echoRes = await shell.executeCommand('echo Hello WebOS Shell');
    expect(echoRes.success).toBe(true);
    expect(echoRes.output).toBe('Hello WebOS Shell');

    // 2. whoami
    const whoRes = await shell.executeCommand('whoami');
    expect(whoRes.success).toBe(true);
    expect(whoRes.output).toBe('user');

    // 3. pwd
    const pwdRes = await shell.executeCommand('pwd');
    expect(pwdRes.success).toBe(true);
    expect(pwdRes.output).toBe('/home/user');

    // 4. help
    const helpRes = await shell.executeCommand('help');
    expect(helpRes.success).toBe(true);
    expect(helpRes.output).toContain('WebOS Shell — Available Commands');
  });

  it('performs complete VFS file operations: mkdir, touch, write, append, cat, ls, cd, rm', async () => {
    const storage = new StorageEngine({ adapter: 'memory' });
    const userManager = new UserManager({ storage });
    const permManager = new PermissionManager({ storage, userManager });
    const fs = new FileSystem({ storage, permissionManager: permManager, userManager });
    const procManager = new ProcessManager({ userManager, permissionManager: permManager, fileSystem: fs });

    userManager.attachFileSystem(fs);
    await fs.initialize();
    await userManager.initialize();
    await permManager.initialize();
    await procManager.initialize();

    const shell = new Shell({
      fileSystem: fs,
      permissionManager: permManager,
      userManager,
      processManager: procManager,
    });
    await shell.initialize();
    await shell.start();

    const session = shell.getDefaultSession();

    // 1. mkdir
    await session.execute('mkdir -p projects/webos');
    expect(await fs.exists('/home/user/projects/webos')).toBe(true);

    // 2. cd
    await session.execute('cd projects/webos');
    expect(session.getCwd()).toBe('/home/user/projects/webos');

    // 3. write & cat
    await session.execute('write readme.md # WebOS Core Engine');
    const catRes = await session.execute('cat readme.md');
    expect(catRes.output).toBe('# WebOS Core Engine');

    // 4. append & cat
    await session.execute('append readme.md \nBuilt with TypeScript');
    const catRes2 = await session.execute('cat readme.md');
    expect(catRes2.output).toContain('# WebOS Core Engine');
    expect(catRes2.output).toContain('Built with TypeScript');

    // 5. ls
    const lsRes = await session.execute('ls');
    expect(lsRes.output).toContain('readme.md');

    // 6. rm
    await session.execute('rm readme.md');
    expect(await fs.exists('/home/user/projects/webos/readme.md')).toBe(false);
  });

  it('enforces permissions on private resources and protected system paths', async () => {
    const storage = new StorageEngine({ adapter: 'memory' });
    const userManager = new UserManager({ storage });
    const permManager = new PermissionManager({ storage, userManager });
    const fs = new FileSystem({ storage, permissionManager: permManager, userManager });
    const procManager = new ProcessManager({ userManager, permissionManager: permManager, fileSystem: fs });

    userManager.attachFileSystem(fs);
    await fs.initialize();
    await userManager.initialize();
    await permManager.initialize();
    await procManager.initialize();

    const shell = new Shell({
      fileSystem: fs,
      permissionManager: permManager,
      userManager,
      processManager: procManager,
    });
    await shell.initialize();
    await shell.start();

    // Standard user tries to write into /system (protected)
    const writeSysRes = await shell.executeCommand('write /system/hack.sys malicious');
    expect(writeSysRes.success).toBe(false);
    expect(writeSysRes.error).toContain('Permission denied');

    // Alice creates private file
    const alice = await userManager.createUser({
      username: 'alice',
      role: USER_ROLES.USER,
      provisionHomeDirectory: true,
    });
    const aliceSession = shell.createSession({ userId: alice.id });
    await aliceSession.execute('write /home/alice/secret.txt TopSecret');

    // Bob tries to read Alice's secret file
    const bob = await userManager.createUser({
      username: 'bob',
      role: USER_ROLES.USER,
      provisionHomeDirectory: true,
    });
    const bobSession = shell.createSession({ userId: bob.id });

    // File in Alice's private directory
    await fs.createFile(
      '/home/alice/diary.txt',
      {
        content: 'Secret Diary',
        mode: DEFAULT_MODES.PRIVATE_FILE,
        ownerId: alice.id,
      },
      { userId: alice.id }
    );

    const readBobRes = await bobSession.execute('cat /home/alice/diary.txt');
    expect(readBobRes.success).toBe(false);
    expect(readBobRes.error).toContain('Permission denied');
  });

  it('integrates with ProcessManager and Scheduler for ps and kill', async () => {
    const storage = new StorageEngine({ adapter: 'memory' });
    const userManager = new UserManager({ storage });
    const permManager = new PermissionManager({ storage, userManager });
    const fs = new FileSystem({ storage, permissionManager: permManager, userManager });
    const procManager = new ProcessManager({ userManager, permissionManager: permManager, fileSystem: fs });
    const scheduler = new Scheduler({ processManager: procManager });

    userManager.attachFileSystem(fs);
    await fs.initialize();
    await userManager.initialize();
    await permManager.initialize();
    await procManager.initialize();
    await scheduler.initialize();
    await scheduler.start();

    const shell = new Shell({
      fileSystem: fs,
      permissionManager: permManager,
      userManager,
      processManager: procManager,
      scheduler,
    });
    await shell.initialize();
    await shell.start();

    const proc = await procManager.createProcess({ name: 'Editor', autoStart: true });
    scheduler.startProcessScheduling(proc.pid);

    // ps
    const psRes = await shell.executeCommand('ps');
    expect(psRes.success).toBe(true);
    expect(psRes.output).toContain('Editor');
    expect(psRes.output).toContain(String(proc.pid));

    // kill
    const killRes = await shell.executeCommand(`kill ${proc.pid}`);
    expect(killRes.success).toBe(true);
    expect(procManager.getProcess(proc.pid)?.state).toBe('TERMINATED');
    expect(scheduler.isProcessScheduled(proc.pid)).toBe(false);
  });

  it('tracks shell command history and environment variables', async () => {
    const shell = new Shell();
    await shell.initialize();
    await shell.start();

    const session = shell.getDefaultSession();
    session.getEnv().setVariable('APP_ENV', 'production');

    await session.execute('echo Current env: $APP_ENV');
    await session.execute('date');
    await session.execute('whoami');

    const history = session.getHistory();
    expect(history.length).toBe(3);
    expect(history[0]).toBe('echo Current env: $APP_ENV');
    expect(history[1]).toBe('date');
    expect(history[2]).toBe('whoami');
  });
});
