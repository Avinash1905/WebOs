import { describe, expect, it } from 'vitest';
import {
  AppArmorProfileParser,
  SeccompBpfFilter,
} from '../../core/permissions/index.js';

describe('AppArmor and Seccomp Security', () => {
  it('AppArmorProfileParser parses AppArmor text and checks path access permissions', () => {
    const profileText = `
profile web_browser {
  /usr/bin/browser rix
  /home/user/downloads rw
  /etc/hosts r
}
`;
    const profile = AppArmorProfileParser.parse(profileText);
    expect(profile.profileName).toBe('web_browser');
    expect(profile.rules.length).toBe(3);

    expect(AppArmorProfileParser.isAllowed(profile, '/home/user/downloads/file.pdf', 'r')).toBe(true);
    expect(AppArmorProfileParser.isAllowed(profile, '/home/user/downloads/file.pdf', 'w')).toBe(true);
    expect(AppArmorProfileParser.isAllowed(profile, '/etc/hosts', 'w')).toBe(false);
  });

  it('SeccompBpfFilter intercepts syscalls and enforces allow/kill policy', () => {
    const seccomp = new SeccompBpfFilter();

    seccomp.allowSyscall(0); // read
    seccomp.allowSyscall(1); // write
    seccomp.allowSyscall(2); // open

    expect(seccomp.evaluateSyscall(0)).toBe('ALLOW');
    expect(seccomp.evaluateSyscall(1)).toBe('ALLOW');
    expect(seccomp.evaluateSyscall(59)).toBe('KILL_PROCESS'); // execve blocked

    seccomp.setDefaultAction('ERRNO');
    expect(seccomp.evaluateSyscall(59)).toBe('ERRNO');
  });
});
