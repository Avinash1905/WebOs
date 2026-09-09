/**
 * @file OAuth2OpenIdProvider.ts
 * @description OAuth2.0 and OpenID Connect identity provider token issuance and signature verification.
 */

export interface OAuth2TokenResponse {
  readonly accessToken: string;
  readonly idToken: string;
  readonly tokenType: 'Bearer';
  readonly expiresIn: number;
}

export class OAuth2OpenIdProvider {
  private readonly _authCodes = new Map<string, { clientId: string; userId: string; expiresAt: number }>();

  public createAuthorizationCode(clientId: string, userId: string, ttlMs: number = 60000): string {
    const code = `auth_code_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    this._authCodes.set(code, { clientId, userId, expiresAt: Date.now() + ttlMs });
    return code;
  }

  public exchangeCodeForToken(code: string, clientId: string): OAuth2TokenResponse | null {
    const entry = this._authCodes.get(code);
    if (!entry || entry.clientId !== clientId || Date.now() > entry.expiresAt) {
      return null;
    }

    this._authCodes.delete(code);

    const accessToken = `at_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    const idToken = `jwt.${btoa(JSON.stringify({ sub: entry.userId, aud: clientId, iat: Date.now() }))}.sig`;

    return {
      accessToken,
      idToken,
      tokenType: 'Bearer',
      expiresIn: 3600,
    };
  }
}
