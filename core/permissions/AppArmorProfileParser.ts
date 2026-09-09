/**
 * @file AppArmorProfileParser.ts
 * @description Linux AppArmor security profile parser and path/capability enforcement.
 */

export interface AppArmorRule {
  readonly pathPattern: string;
  readonly permissions: string; // 'r', 'w', 'rw', 'rix'
}

export interface AppArmorProfile {
  readonly profileName: string;
  readonly flags: string[];
  readonly rules: AppArmorRule[];
}

export class AppArmorProfileParser {
  public static parse(profileText: string): AppArmorProfile {
    const lines = profileText.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
    const rules: AppArmorRule[] = [];
    let name = 'default_profile';

    for (const line of lines) {
      if (line.startsWith('profile ')) {
        name = line.replace('profile ', '').replace('{', '').trim();
      } else if (line.includes(' ')) {
        const parts = line.split(/\s+/);
        if (parts.length >= 2 && parts[0] && parts[1]) {
          rules.push({ pathPattern: parts[0], permissions: parts[1] });
        }
      }
    }

    return {
      profileName: name,
      flags: ['enforce'],
      rules,
    };
  }

  public static isAllowed(profile: AppArmorProfile, targetPath: string, perm: 'r' | 'w'): boolean {
    for (const rule of profile.rules) {
      if (targetPath.startsWith(rule.pathPattern.replace('*', ''))) {
        return rule.permissions.includes(perm);
      }
    }
    return false;
  }
}
