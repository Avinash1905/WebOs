/**
 * @file AppSandboxToken.ts
 * @description Cryptographically structured capability tokens for sandboxed applications.
 */

export interface SandboxScope {
  readonly readPaths: readonly string[];
  readonly writePaths: readonly string[];
  readonly allowedServices: readonly string[];
  readonly canForkProcess: boolean;
  readonly canAccessNetwork: boolean;
}

export interface AppSandboxToken {
  readonly tokenId: string;
  readonly appId: string;
  readonly issuedAt: number;
  readonly expiresAt: number;
  readonly scope: SandboxScope;
  readonly signature: string;
}

export class AppSandboxTokenManager {
  private readonly tokens = new Map<string, AppSandboxToken>();

  public issueToken(appId: string, scope: SandboxScope, ttlMs = 3600000): AppSandboxToken {
    const now = Date.now();
    const tokenId = `token_${appId}_${now}_${Math.floor(Math.random() * 10000)}`;
    const signature = this.computeSignature(tokenId, appId, now, now + ttlMs);

    const token: AppSandboxToken = {
      tokenId,
      appId,
      issuedAt: now,
      expiresAt: now + ttlMs,
      scope: {
        readPaths: Object.freeze([...scope.readPaths]),
        writePaths: Object.freeze([...scope.writePaths]),
        allowedServices: Object.freeze([...scope.allowedServices]),
        canForkProcess: scope.canForkProcess,
        canAccessNetwork: scope.canAccessNetwork
      },
      signature
    };

    this.tokens.set(tokenId, token);
    return token;
  }

  public validateToken(token: AppSandboxToken): boolean {
    if (Date.now() > token.expiresAt) return false;
    const expected = this.computeSignature(token.tokenId, token.appId, token.issuedAt, token.expiresAt);
    return token.signature === expected && this.tokens.has(token.tokenId);
  }

  public canAccessPath(token: AppSandboxToken, targetPath: string, mode: 'read' | 'write'): boolean {
    if (!this.validateToken(token)) return false;
    const paths = mode === 'write' ? token.scope.writePaths : token.scope.readPaths;
    return paths.some(p => targetPath === p || targetPath.startsWith(p === '/' ? '/' : `${p}/`));
  }

  public revokeToken(tokenId: string): boolean {
    return this.tokens.delete(tokenId);
  }

  private computeSignature(tokenId: string, appId: string, issuedAt: number, expiresAt: number): string {
    // Pure hash simulation
    let hash = 0;
    const str = `${tokenId}:${appId}:${issuedAt}:${expiresAt}:webos_secret_salt`;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }
}
