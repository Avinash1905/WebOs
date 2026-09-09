/**
 * WebOS Core - Dynamic ProcFS (/proc) Virtual Filesystem
 * Provides live kernel and process diagnostic pseudo-files.
 */

export class VirtualProcFs {
  private static instance: VirtualProcFs;
  private bootTime = Date.now();

  private constructor() {}

  public static getInstance(): VirtualProcFs {
    if (!VirtualProcFs.instance) {
      VirtualProcFs.instance = new VirtualProcFs();
    }
    return VirtualProcFs.instance;
  }

  public isProcPath(path: string): boolean {
    return path.startsWith('/proc');
  }

  public readProcFile(path: string): string | null {
    const uptimeSec = Math.floor((Date.now() - this.bootTime) / 1000);

    switch (path) {
      case '/proc/version':
        return 'WebOS Microkernel Version 3.2.0-generic (gcc 13.2) #1 SMP PREEMPT 2026 x86_64 GNU/Linux\n';

      case '/proc/uptime':
        return `${uptimeSec}.24 ${Math.floor(uptimeSec * 0.85)}.10\n`;

      case '/proc/meminfo':
        return [
          'MemTotal:        16384000 kB',
          'MemFree:          8192000 kB',
          'MemAvailable:    12288000 kB',
          'Buffers:           256000 kB',
          'Cached:           4096000 kB',
          'SwapTotal:        4194304 kB',
          'SwapFree:         4194304 kB',
        ].join('\n') + '\n';

      case '/proc/cpuinfo':
        return [
          'processor       : 0',
          'vendor_id       : GenuineWebOS',
          'cpu family      : 6',
          'model name      : WebOS Virtual Processor v4 @ 3.40GHz',
          'cpu MHz         : 3400.000',
          'cache size      : 16384 KB',
          'flags           : fpu vme de pse tsc msr pae mce cx8 apic sep mtrr pge mca cmov',
          'bogomips        : 6800.00',
        ].join('\n') + '\n';

      case '/proc/mounts':
        return [
          'rootfs / rootfs rw 0 0',
          'sysfs /sys sysfs rw,nosuid,nodev,noexec 0 0',
          'proc /proc proc rw,nosuid,nodev,noexec 0 0',
          'devtmpfs /dev devtmpfs rw,nosuid,size=8192000k,nr_inodes=2048000,mode=755 0 0',
          'tmpfs /tmp tmpfs rw,nosuid,nodev 0 0',
        ].join('\n') + '\n';

      default:
        // Handle /proc/[pid]/status
        const pidMatch = path.match(/^\/proc\/(\d+)\/status$/);
        if (pidMatch) {
          const pid = pidMatch[1];
          return [
            `Name:   process_${pid}`,
            `State:  S (sleeping)`,
            `Tgid:   ${pid}`,
            `Pid:    ${pid}`,
            `PPid:   1`,
            `Uid:    1000    1000    1000    1000`,
            `Gid:    1000    1000    1000    1000`,
            `VmSize:    24576 kB`,
            `VmRSS:     12288 kB`,
            `Threads: 1`,
          ].join('\n') + '\n';
        }
        return null;
    }
  }

  public listProcEntries(path: string): string[] {
    if (path === '/proc') {
      return ['version', 'uptime', 'meminfo', 'cpuinfo', 'mounts', '1', 'self'];
    }
    const pidMatch = path.match(/^\/proc\/(\d+)$/);
    if (pidMatch) {
      return ['status', 'cmdline', 'stat', 'environ', 'fd', 'cwd'];
    }
    return [];
  }
}

export const procFs = VirtualProcFs.getInstance();
