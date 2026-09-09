/**
 * WebOS Backend - Master Authentication Service
 * User registration, credential hashing, login, session tokens, and refresh tokens.
 */

import { jwtService } from './jwt';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'developer' | 'user' | 'guest';
  createdAt: number;
  lastLoginAt: number;
}

export interface AuthSession {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
  expiresAt: number;
}

export class AuthService {
  private users: Map<string, AuthUser> = new Map();
  private refreshTokens: Map<string, { userId: string; expiresAt: number }> = new Map();

  constructor() {
    this.seedDefaultUsers();
  }

  private hashPassword(password: string): string {
    let hash = 0x811c9dc5;
    for (let i = 0; i < password.length; i++) {
      hash ^= password.charCodeAt(i);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return `sha_${(hash >>> 0).toString(16)}`;
  }

  private seedDefaultUsers() {
    const adminUser: AuthUser = {
      id: 'usr-admin-1',
      username: 'admin',
      email: 'admin@webos.local',
      passwordHash: this.hashPassword('admin123'),
      role: 'admin',
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
    };
    const devUser: AuthUser = {
      id: 'usr-dev-2',
      username: 'developer',
      email: 'dev@webos.local',
      passwordHash: this.hashPassword('developer123'),
      role: 'developer',
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
    };
    this.users.set(adminUser.username, adminUser);
    this.users.set(devUser.username, devUser);
  }

  public async login(username: string, password: string): Promise<AuthSession | null> {
    const user = this.users.get(username);
    if (!user) return null;

    const hash = this.hashPassword(password);
    if (user.passwordHash !== hash) {
      return null;
    }

    user.lastLoginAt = Date.now();

    const token = jwtService.sign({
      sub: user.id,
      username: user.username,
      role: user.role,
    }, 86400); // 24h

    const refreshToken = `ref_${Math.random().toString(36).substring(2)}_${Date.now()}`;
    this.refreshTokens.set(refreshToken, {
      userId: user.id,
      expiresAt: Date.now() + 7 * 86400 * 1000,
    });

    return {
      token,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      expiresAt: Date.now() + 86400 * 1000,
    };
  }

  public async register(username: string, email: string, password: string): Promise<AuthSession> {
    if (this.users.has(username)) {
      throw new Error(`Username '${username}' is already taken.`);
    }

    const newUser: AuthUser = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      username,
      email,
      passwordHash: this.hashPassword(password),
      role: 'user',
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
    };

    this.users.set(username, newUser);

    const session = await this.login(username, password);
    return session!;
  }

  public async refresh(refreshToken: string): Promise<AuthSession | null> {
    const sessionData = this.refreshTokens.get(refreshToken);
    if (!sessionData || sessionData.expiresAt < Date.now()) {
      this.refreshTokens.delete(refreshToken);
      return null;
    }

    const user = Array.from(this.users.values()).find((u) => u.id === sessionData.userId);
    if (!user) return null;

    const token = jwtService.sign({
      sub: user.id,
      username: user.username,
      role: user.role,
    }, 86400);

    return {
      token,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      expiresAt: Date.now() + 86400 * 1000,
    };
  }
}

export const authService = new AuthService();
