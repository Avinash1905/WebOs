/**
 * WebOS Backend Enterprise - OAuth2 & OpenID Connect (OIDC) Identity Provider
 */

import { CryptoHash } from '../../core/crypto/hash';
import { JWTService } from '../auth/jwt';

export interface OAuthClientApp {
  clientId: string;
  clientSecret: string;
  redirectUris: string[];
  appName: string;
  allowedScopes: string[];
}

export interface AuthCodeGrant {
  code: string;
  clientId: string;
  userId: string;
  redirectUri: string;
  scope: string;
  codeChallenge?: string;
  codeChallengeMethod?: 'S256' | 'plain';
  expiresAt: number;
}

export class OAuth2Server {
  private static instance: OAuth2Server;
  private clients: Map<string, OAuthClientApp> = new Map();
  private authCodes: Map<string, AuthCodeGrant> = new Map();

  private constructor() {
    this.seedDefaultClients();
  }

  public static getInstance(): OAuth2Server {
    if (!OAuth2Server.instance) {
      OAuth2Server.instance = new OAuth2Server();
    }
    return OAuth2Server.instance;
  }

  private seedDefaultClients(): void {
    this.clients.set('client-webos-ide', {
      clientId: 'client-webos-ide',
      clientSecret: 'sec_webos_dev_secret_9942',
      redirectUris: ['http://localhost:5173/auth/callback', 'https://webos.local/callback'],
      appName: 'WebOS Cloud Developer Studio',
      allowedScopes: ['openid', 'profile', 'email', 'vfs:read', 'vfs:write'],
    });
  }

  public generateAuthCode(params: {
    clientId: string;
    userId: string;
    redirectUri: string;
    scope: string;
    codeChallenge?: string;
    codeChallengeMethod?: 'S256' | 'plain';
  }): string {
    const client = this.clients.get(params.clientId);
    if (!client) throw new Error(`Invalid client ID '${params.clientId}'`);
    if (!client.redirectUris.includes(params.redirectUri)) {
      throw new Error('Redirect URI mismatch');
    }

    const code = `code_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    this.authCodes.set(code, {
      code,
      clientId: params.clientId,
      userId: params.userId,
      redirectUri: params.redirectUri,
      scope: params.scope,
      codeChallenge: params.codeChallenge,
      codeChallengeMethod: params.codeChallengeMethod,
      expiresAt: Date.now() + 300 * 1000, // 5 min TTL
    });

    return code;
  }

  public async exchangeCodeForToken(params: {
    code: string;
    clientId: string;
    clientSecret?: string;
    redirectUri: string;
    codeVerifier?: string;
  }): Promise<{ access_token: string; token_type: string; expires_in: number; id_token?: string }> {
    const grant = this.authCodes.get(params.code);
    if (!grant) throw new Error('Invalid or expired authorization code');
    if (Date.now() > grant.expiresAt) {
      this.authCodes.delete(params.code);
      throw new Error('Authorization code expired');
    }

    // PKCE verification if challenge was set
    if (grant.codeChallenge) {
      if (!params.codeVerifier) throw new Error('Code verifier required for PKCE');
      if (grant.codeChallengeMethod === 'S256') {
        const computed = await CryptoHash.sha256(params.codeVerifier);
        if (computed !== grant.codeChallenge) {
          throw new Error('Invalid PKCE code verifier challenge mismatch');
        }
      } else if (params.codeVerifier !== grant.codeChallenge) {
        throw new Error('Invalid PKCE code verifier');
      }
    }

    this.authCodes.delete(params.code);

    const accessToken = new JWTService().sign({
      sub: grant.userId,
      username: grant.userId,
      role: 'user',
    }, 3600);

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
    };
  }
}

export const oauth2Server = OAuth2Server.getInstance();
