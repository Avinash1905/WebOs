/**
 * WebOS Core - SemVer (Semantic Versioning) Engine
 */

export class SemVer {
  public static parse(version: string): { major: number; minor: number; patch: number } | null {
    const clean = version.trim().replace(/^[v=]/, '');
    const match = clean.match(/^(\d+)\.(\d+)\.(\d+)/);
    if (!match) return null;
    return {
      major: parseInt(match[1], 10),
      minor: parseInt(match[2], 10),
      patch: parseInt(match[3], 10),
    };
  }

  public static compare(v1: string, v2: string): number {
    const p1 = this.parse(v1);
    const p2 = this.parse(v2);
    if (!p1 || !p2) return 0;

    if (p1.major !== p2.major) return p1.major - p2.major;
    if (p1.minor !== p2.minor) return p1.minor - p2.minor;
    return p1.patch - p2.patch;
  }

  public static satisfies(version: string, constraint: string): boolean {
    if (constraint === '*' || constraint === 'latest') return true;

    const parsedVer = this.parse(version);
    if (!parsedVer) return false;

    if (constraint.startsWith('^')) {
      // ^1.2.3: >= 1.2.3 and < 2.0.0
      const base = this.parse(constraint.substring(1));
      if (!base) return false;
      return (
        parsedVer.major === base.major &&
        (parsedVer.minor > base.minor || (parsedVer.minor === base.minor && parsedVer.patch >= base.patch))
      );
    }

    if (constraint.startsWith('~')) {
      // ~1.2.3: >= 1.2.3 and < 1.3.0
      const base = this.parse(constraint.substring(1));
      if (!base) return false;
      return (
        parsedVer.major === base.major &&
        parsedVer.minor === base.minor &&
        parsedVer.patch >= base.patch
      );
    }

    if (constraint.startsWith('>=')) {
      return this.compare(version, constraint.substring(2)) >= 0;
    }

    if (constraint.startsWith('<=')) {
      return this.compare(version, constraint.substring(2)) <= 0;
    }

    return this.compare(version, constraint) === 0;
  }
}
