/**
 * @file UserProfileProvisioner.ts
 * @description Standard user home directory and environment skeleton provisioner.
 */

import type { FileSystem } from '../filesystem/FileSystem.js';

export class UserProfileProvisioner {
  constructor(private readonly fs: FileSystem) {}

  public async provisionSkeleton(username: string, homePath = `/home/${username}`): Promise<string[]> {
    const created: string[] = [];

    const standardDirs = [
      homePath,
      `${homePath}/Desktop`,
      `${homePath}/Documents`,
      `${homePath}/Downloads`,
      `${homePath}/Pictures`,
      `${homePath}/Music`,
      `${homePath}/Videos`,
      `${homePath}/.config`
    ];

    for (const dir of standardDirs) {
      if (!(await this.fs.exists(dir))) {
        await this.fs.createDirectory(dir, { recursive: true });
        created.push(dir);
      }
    }

    // Provision default dotfiles
    const bashrc = `${homePath}/.bashrc`;
    if (!(await this.fs.exists(bashrc))) {
      await this.fs.createFile(bashrc, {
        content: `# WebOS User Profile for ${username}\nexport USER=${username}\nexport HOME=${homePath}\nalias ll='ls -la'\n`
      });
      created.push(bashrc);
    }

    const config = `${homePath}/.config/settings.json`;
    if (!(await this.fs.exists(config))) {
      await this.fs.createFile(config, {
        content: JSON.stringify({ theme: 'dark', locale: 'en-US', autoSave: true }, null, 2)
      });
      created.push(config);
    }

    return created;
  }
}
