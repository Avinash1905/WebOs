/**
 * @file GlobMatcher.ts
 * @description POSIX fnmatch/glob wildcard pattern compiler and matcher.
 */

export class GlobMatcher {
  /**
   * Matches a string against a glob pattern supporting *, **, ?, and [a-z].
   */
  public static match(pattern: string, path: string): boolean {
    const regex = this.globToRegex(pattern);
    return regex.test(path);
  }

  /**
   * Filters an array of paths by a glob pattern.
   */
  public static filter(pattern: string, paths: readonly string[]): string[] {
    const regex = this.globToRegex(pattern);
    return paths.filter((p) => regex.test(p));
  }

  private static globToRegex(pattern: string): RegExp {
    let regexStr = '^';
    let i = 0;

    while (i < pattern.length) {
      const c = pattern[i]!;

      if (c === '*') {
        if (pattern[i + 1] === '*') {
          // ** matches any path segments including slashes
          regexStr += '.*';
          i += 2;
          if (pattern[i] === '/') i++; // skip trailing slash after **
          continue;
        } else {
          // * matches any character except slash
          regexStr += '[^/]*';
          i++;
          continue;
        }
      } else if (c === '?') {
        regexStr += '[^/]';
        i++;
        continue;
      } else if (c === '.') {
        regexStr += '\\.';
        i++;
        continue;
      } else if (c === '/') {
        regexStr += '\\/';
        i++;
        continue;
      } else {
        regexStr += c;
        i++;
      }
    }

    regexStr += '$';
    return new RegExp(regexStr);
  }
}
