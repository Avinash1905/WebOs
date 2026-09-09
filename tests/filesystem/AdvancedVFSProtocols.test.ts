import { describe, expect, it } from 'vitest';
import {
  OverlayFileSystem,
  InotifySystemWatcher,
  InotifyMask,
  FUSEDriverBridge,
} from '../../core/filesystem/index.js';

describe('Advanced VFS Protocols', () => {
  it('OverlayFileSystem layers upper RW layer over lower RO layer with whiteout masking', () => {
    const overlay = new OverlayFileSystem();

    overlay.mountLower({
      '/etc/hostname': 'webos-host',
      '/etc/os-release': 'WebOS 1.0',
    });

    expect(overlay.readFile('/etc/hostname')).toBe('webos-host');

    // COW write to upper layer
    overlay.writeFile('/etc/hostname', 'webos-custom');
    expect(overlay.readFile('/etc/hostname')).toBe('webos-custom');

    // Unlink marks whiteout
    overlay.unlink('/etc/os-release');
    expect(overlay.readFile('/etc/os-release')).toBeNull();
    expect(overlay.exists('/etc/os-release')).toBe(false);

    const files = overlay.listFiles();
    expect(files).toContain('/etc/hostname');
    expect(files).not.toContain('/etc/os-release');
  });

  it('InotifySystemWatcher triggers file creation/modification events and polls descriptors', () => {
    const inotify = new InotifySystemWatcher();

    const wd = inotify.addWatch('/var/log', InotifyMask.IN_CREATE | InotifyMask.IN_MODIFY);
    expect(wd).toBe(1);

    inotify.triggerEvent('/var/log/syslog', InotifyMask.IN_CREATE, 'syslog');
    inotify.triggerEvent('/var/log/syslog', InotifyMask.IN_MODIFY, 'syslog');

    const events = inotify.pollEvents();
    expect(events.length).toBe(2);
    expect(events[0]!.mask).toBe(InotifyMask.IN_CREATE);
    expect(events[1]!.mask).toBe(InotifyMask.IN_MODIFY);

    expect(inotify.pollEvents().length).toBe(0); // Poll clears queue
  });

  it('FUSEDriverBridge dispatches userspace filesystem calls for getattr and readdir', async () => {
    const fuse = new FUSEDriverBridge();

    fuse.mount('/mnt/customfs', {
      getattr: async (p) => (p === '/' ? { size: 4096, isDirectory: true } : { size: 120, isDirectory: false }),
      readdir: async () => ['file1.txt', 'file2.txt'],
    });

    expect(fuse.mountPoint).toBe('/mnt/customfs');

    const attr = await fuse.handleGetAttr('/');
    expect(attr?.isDirectory).toBe(true);

    const entries = await fuse.handleReaddir('/');
    expect(entries).toEqual(['file1.txt', 'file2.txt']);
  });
});
