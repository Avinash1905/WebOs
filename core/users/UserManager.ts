/**
 * @file UserManager.ts
 * @description Central User and Session Management service for WebOS.
 */

import type { EventBus } from '../events/index.js';
import type { FileSystem } from '../filesystem/index.js';
import { BaseSystemService } from '../kernel/Service.js';
import { type NamespaceStorage, StorageEngine } from '../storage/index.js';
import { USER_ROLES } from './RoleManager.js';
import type {
  CreateUserOptions,
  DeleteUserOptions,
  Session,
  SessionFilter,
  UpdateUserOptions,
  User,
  UserManagerConfig,
} from './types.js';
import {
  InvalidSessionError,
  InvalidUsernameError,
  ProtectedUserError,
  SessionExpiredError,
  SessionNotFoundError,
  UserAlreadyExistsError,
  UserNotFoundError,
} from './UserError.js';

let userCounter = 0;
let sessionCounter = 0;

/**
 * Generates a unique user ID.
 */
function generateUserId(): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `usr_${Date.now()}_${++userCounter}_${rand}`;
}

/**
 * Generates a unique session ID.
 */
function generateSessionId(): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `sess_${Date.now()}_${++sessionCounter}_${rand}`;
}

/**
 * Validates a username format.
 */
function validateUsername(username: string): void {
  if (!username || typeof username !== 'string') {
    throw new InvalidUsernameError(username, 'Username cannot be empty');
  }
  const trimmed = username.trim();
  if (trimmed.length < 2 || trimmed.length > 32) {
    throw new InvalidUsernameError(
      username,
      'Username must be between 2 and 32 characters'
    );
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    throw new InvalidUsernameError(
      username,
      'Username may only contain letters, numbers, underscores, and hyphens'
    );
  }
}

/**
 * WebOS Local User and Session Manager Service.
 */
export class UserManager extends BaseSystemService {
  public override readonly name = 'users';
  public override readonly dependencies: readonly string[] = ['storage'];
  public override readonly optionalDependencies: readonly string[] = [
    'event-bus',
  ];

  private readonly _users = new Map<string, User>(); // id -> User
  private readonly _usernameIndex = new Map<string, string>(); // username (lowercase) -> id
  private readonly _sessions = new Map<string, Session>(); // sessionId -> Session

  private _storageEngine?: StorageEngine;
  private _userStorage?: NamespaceStorage;
  private _sessionStorage?: NamespaceStorage;
  private _eventBus?: EventBus;
  private _fileSystem?: FileSystem;

  private _currentSessionId: string | null = null;
  private readonly _config: UserManagerConfig;

  constructor(config?: UserManagerConfig) {
    super();
    this._config = config ?? {};
    this._eventBus = config?.eventBus;
    this._fileSystem = config?.fileSystem;

    if (config?.storage) {
      this.attachStorage(config.storage);
    }
  }

  /**
   * Attaches the StorageEngine for persistence.
   */
  public attachStorage(storage: StorageEngine): void {
    this._storageEngine = storage;
    this._userStorage = storage.namespace('users');
    this._sessionStorage = storage.namespace('sessions');
  }

  /**
   * Attaches an EventBus instance.
   */
  public attachEventBus(eventBus: EventBus): void {
    this._eventBus = eventBus;
  }

  /**
   * Attaches a FileSystem instance for automatic home directory provisioning.
   */
  public attachFileSystem(fileSystem: FileSystem): void {
    this._fileSystem = fileSystem;
  }

  // =========================================================================
  // Service Lifecycle
  // =========================================================================

  protected override async onInitialize(): Promise<void> {
    if (!this._storageEngine) {
      this.attachStorage(new StorageEngine());
    }

    if (this._storageEngine) {
      await this._storageEngine.initialize();
    }

    // 1. Rehydrate existing users from storage
    if (this._userStorage) {
      const keys = await this._userStorage.keys();
      if (keys.length > 0) {
        const persistedUsers = await this._userStorage.getMany<User>(keys);
        for (const user of persistedUsers.values()) {
          if (user && user.id && user.username) {
            this._users.set(user.id, user);
            this._usernameIndex.set(user.username.toLowerCase(), user.id);
          }
        }
      }
    }

    // 2. Create default users if storage is empty
    if (this._users.size === 0 && this._config.createDefaultUsers !== false) {
      await this._provisionDefaultUsers();
    }

    // 3. Rehydrate sessions from storage (pruning expired ones)
    if (this._sessionStorage) {
      const sessionKeys = await this._sessionStorage.keys();
      if (sessionKeys.length > 0) {
        const persistedSessions = await this._sessionStorage.getMany<Session>(sessionKeys);
        const now = Date.now();
        for (const session of persistedSessions.values()) {
          if (
            session &&
            session.status === 'ACTIVE' &&
            (!session.expiresAt || session.expiresAt > now)
          ) {
            this._sessions.set(session.sessionId, session);
          }
        }
      }
    }

    // 4. Default active session if available
    const activeSessions = Array.from(this._sessions.values()).filter(
      (s) => s.status === 'ACTIVE'
    );
    const firstSession = activeSessions[0];
    if (firstSession) {
      this._currentSessionId = firstSession.sessionId;
    } else {
      // Auto-start session for standard user or admin if any exist
      const firstUser = Array.from(this._users.values())[0];
      const defaultUser =
        this.getUserByUsernameSync('user') ??
        this.getUserByUsernameSync('admin') ??
        firstUser;
      if (defaultUser) {
        await this.createSession(defaultUser.id);
      }
    }
  }

  protected override async onStop(): Promise<void> {
    this._users.clear();
    this._usernameIndex.clear();
    this._sessions.clear();
    this._currentSessionId = null;
  }

  private async _provisionDefaultUsers(): Promise<void> {
    // 1. System Admin
    await this.createUser({
      username: 'admin',
      displayName: 'System Administrator',
      role: USER_ROLES.ADMIN,
      isProtected: true,
      provisionHomeDirectory: true,
      preferences: { theme: 'dark', language: 'en' },
    });

    // 2. Standard User
    await this.createUser({
      username: 'user',
      displayName: 'Default User',
      role: USER_ROLES.USER,
      isProtected: false,
      provisionHomeDirectory: true,
      preferences: { theme: 'light', language: 'en' },
    });

    // 3. Guest Account
    await this.createUser({
      username: 'guest',
      displayName: 'Guest User',
      role: USER_ROLES.GUEST,
      isProtected: true,
      provisionHomeDirectory: false,
      preferences: { theme: 'light', language: 'en' },
    });
  }

  // =========================================================================
  // User Management CRUD
  // =========================================================================

  /**
   * Creates a new user account.
   */
  public async createUser(options: CreateUserOptions): Promise<User> {
    validateUsername(options.username);

    const usernameLower = options.username.toLowerCase();
    if (this._usernameIndex.has(usernameLower)) {
      throw new UserAlreadyExistsError(options.username);
    }

    const now = Date.now();
    const id = generateUserId();
    const homeDirectory = options.homeDirectory ?? `/home/${options.username}`;
    const role = options.role ?? USER_ROLES.USER;

    const user: User = {
      id,
      username: options.username,
      displayName: options.displayName ?? options.username,
      role,
      homeDirectory,
      preferences: Object.freeze({ ...(options.preferences ?? {}) }),
      createdAt: now,
      updatedAt: now,
      isProtected: options.isProtected ?? false,
    };

    // 1. Provision Home Directory if VFS is connected
    if (options.provisionHomeDirectory !== false && this._fileSystem) {
      await this._provisionUserHome(homeDirectory, id);
    }

    // 2. Cache in memory
    this._users.set(id, user);
    this._usernameIndex.set(usernameLower, id);

    // 3. Persist to storage
    if (this._userStorage) {
      await this._userStorage.set(id, user);
    }

    // 4. Emit event
    if (this._eventBus) {
      this._eventBus.emit('USER_CREATED', {
        userId: user.id,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt,
      });
    }

    return user;
  }

  /**
   * Retrieves a user by their unique user ID.
   */
  public async getUser(id: string): Promise<User | null> {
    return this._users.get(id) ?? null;
  }

  /**
   * Synchronous user lookup by ID.
   */
  public getUserSync(id: string): User | null {
    return this._users.get(id) ?? null;
  }

  /**
   * Retrieves a user by their username (case-insensitive).
   */
  public async getUserByUsername(username: string): Promise<User | null> {
    return this.getUserByUsernameSync(username);
  }

  /**
   * Synchronous user lookup by username.
   */
  public getUserByUsernameSync(username: string): User | null {
    const id = this._usernameIndex.get(username.toLowerCase());
    if (!id) return null;
    return this._users.get(id) ?? null;
  }

  /**
   * Updates an existing user's profile or preferences.
   */
  public async updateUser(
    id: string,
    updates: UpdateUserOptions
  ): Promise<User> {
    const existing = this._users.get(id);
    if (!existing) {
      throw new UserNotFoundError(id);
    }

    const changedFields: string[] = [];
    let displayName = existing.displayName;
    let role = existing.role;
    let preferences = existing.preferences;

    if (updates.displayName !== undefined && updates.displayName !== existing.displayName) {
      displayName = updates.displayName;
      changedFields.push('displayName');
    }

    if (updates.role !== undefined && updates.role !== existing.role) {
      role = updates.role;
      changedFields.push('role');
    }

    if (updates.preferences !== undefined) {
      preferences = Object.freeze({
        ...existing.preferences,
        ...updates.preferences,
      });
      changedFields.push('preferences');
    }

    const updatedUser: User = {
      ...existing,
      displayName,
      role,
      preferences,
      updatedAt: Date.now(),
    };

    this._users.set(id, updatedUser);

    if (this._userStorage) {
      await this._userStorage.set(id, updatedUser);
    }

    if (this._eventBus) {
      this._eventBus.emit('USER_UPDATED', {
        userId: id,
        username: updatedUser.username,
        changes: changedFields,
      });
    }

    return updatedUser;
  }

  /**
   * Deletes a user account.
   */
  public async deleteUser(
    id: string,
    options?: DeleteUserOptions
  ): Promise<void> {
    const existing = this._users.get(id);
    if (!existing) {
      throw new UserNotFoundError(id);
    }

    if (existing.isProtected && !options?.force) {
      throw new ProtectedUserError(existing.username);
    }

    // 1. Terminate all active sessions for this user
    for (const session of this._sessions.values()) {
      if (session.userId === id && session.status === 'ACTIVE') {
        await this.endSession(session.sessionId);
      }
    }

    // 2. Optionally delete home directory in VFS
    if (options?.removeHomeDirectory && this._fileSystem) {
      if (await this._fileSystem.exists(existing.homeDirectory)) {
        await this._fileSystem.delete(existing.homeDirectory, {
          recursive: true,
          useTrash: false,
        });
      }
    }

    // 3. Remove from memory and storage
    this._users.delete(id);
    this._usernameIndex.delete(existing.username.toLowerCase());

    if (this._userStorage) {
      await this._userStorage.delete(id);
    }

    // 4. Emit event
    if (this._eventBus) {
      this._eventBus.emit('USER_DELETED', {
        userId: id,
        username: existing.username,
      });
    }
  }

  /**
   * Returns a list of all local users.
   */
  public async listUsers(): Promise<User[]> {
    return Array.from(this._users.values());
  }

  // =========================================================================
  // Home Directory Provisioning
  // =========================================================================

  private async _provisionUserHome(
    homePath: string,
    ownerId: string
  ): Promise<void> {
    if (!this._fileSystem) return;

    try {
      const systemContext = {
        userId: 'system',
        role: 'ADMIN' as const,
        isSystem: true,
      };

      const subdirs = ['Desktop', 'Documents', 'Downloads', 'Pictures', 'Music'];

      if (!(await this._fileSystem.exists(homePath))) {
        await this._fileSystem.createDirectory(
          homePath,
          {
            recursive: true,
            ownerId,
          },
          systemContext
        );
      } else {
        await this._fileSystem.setOwner(homePath, ownerId, systemContext);
      }

      for (const dir of subdirs) {
        const fullPath = `${homePath}/${dir}`;
        if (!(await this._fileSystem.exists(fullPath))) {
          await this._fileSystem.createDirectory(
            fullPath,
            {
              recursive: true,
              ownerId,
            },
            systemContext
          );
        } else {
          await this._fileSystem.setOwner(fullPath, ownerId, systemContext);
        }
      }
    } catch {
      // Best-effort directory creation
    }
  }

  // =========================================================================
  // Session Management
  // =========================================================================

  /**
   * Creates a new session for a user and sets it as active.
   */
  public async createSession(
    userIdOrUsername: string,
    metadata?: Record<string, unknown>
  ): Promise<Session> {
    let user = this._users.get(userIdOrUsername);
    if (!user) {
      user = this.getUserByUsernameSync(userIdOrUsername) ?? undefined;
    }
    if (!user) {
      throw new UserNotFoundError(userIdOrUsername);
    }

    const now = Date.now();
    const sessionId = generateSessionId();
    const duration = this._config.sessionDurationMs ?? 24 * 60 * 60 * 1000;
    const expiresAt = duration > 0 ? now + duration : undefined;

    const session: Session = {
      sessionId,
      userId: user.id,
      username: user.username,
      role: user.role,
      status: 'ACTIVE',
      createdAt: now,
      lastActiveAt: now,
      expiresAt,
      metadata: metadata ? Object.freeze({ ...metadata }) : undefined,
    };

    this._sessions.set(sessionId, session);
    this._currentSessionId = sessionId;

    if (this._sessionStorage) {
      await this._sessionStorage.set(sessionId, session);
    }

    if (this._eventBus) {
      this._eventBus.emit('SESSION_STARTED', {
        sessionId,
        userId: user.id,
        startedAt: now,
      });

      this._eventBus.emit('USER_LOGIN', {
        userId: user.id,
        username: user.username,
        loginAt: now,
      });
    }

    return session;
  }

  /**
   * Retrieves a session by ID.
   */
  public async getSession(sessionId: string): Promise<Session | null> {
    const session = this._sessions.get(sessionId);
    if (!session) return null;

    // Check expiration
    if (session.status === 'ACTIVE' && session.expiresAt && session.expiresAt < Date.now()) {
      await this.endSession(sessionId);
      return this._sessions.get(sessionId) ?? null;
    }

    return session;
  }

  /**
   * Returns the currently active session.
   */
  public getCurrentSession(): Session | null {
    if (!this._currentSessionId) return null;
    const session = this._sessions.get(this._currentSessionId);
    if (!session || session.status !== 'ACTIVE') return null;

    if (session.expiresAt && session.expiresAt < Date.now()) {
      return null;
    }
    return session;
  }

  /**
   * Returns the user associated with the currently active session.
   */
  public getCurrentUser(): User | null {
    const session = this.getCurrentSession();
    if (!session) return null;
    return this._users.get(session.userId) ?? null;
  }

  /**
   * Switches the active session to a different user.
   */
  public async switchUser(userIdOrUsername: string): Promise<Session> {
    return this.createSession(userIdOrUsername);
  }

  /**
   * Updates lastActiveAt for an active session.
   */
  public async touchSession(sessionId?: string): Promise<void> {
    const targetId = sessionId ?? this._currentSessionId;
    if (!targetId) return;

    const session = this._sessions.get(targetId);
    if (!session || session.status !== 'ACTIVE') return;

    const now = Date.now();
    if (session.expiresAt && session.expiresAt < now) {
      await this.endSession(targetId);
      throw new SessionExpiredError(targetId);
    }

    const updatedSession: Session = {
      ...session,
      lastActiveAt: now,
    };

    this._sessions.set(targetId, updatedSession);
    if (this._sessionStorage) {
      await this._sessionStorage.set(targetId, updatedSession);
    }
  }

  /**
   * Ends an active session.
   */
  public async endSession(sessionId?: string): Promise<void> {
    const targetId = sessionId ?? this._currentSessionId;
    if (!targetId) {
      throw new InvalidSessionError('No session specified to end');
    }

    const session = this._sessions.get(targetId);
    if (!session) {
      throw new SessionNotFoundError(targetId);
    }

    if (session.status === 'ENDED') {
      return;
    }

    const now = Date.now();
    const durationMs = now - session.createdAt;

    const endedSession: Session = {
      ...session,
      status: 'ENDED',
      lastActiveAt: now,
    };

    this._sessions.set(targetId, endedSession);

    if (this._currentSessionId === targetId) {
      this._currentSessionId = null;
    }

    if (this._sessionStorage) {
      await this._sessionStorage.set(targetId, endedSession);
    }

    if (this._eventBus) {
      this._eventBus.emit('SESSION_ENDED', {
        sessionId: targetId,
        userId: session.userId,
        durationMs,
      });

      this._eventBus.emit('USER_LOGOUT', {
        userId: session.userId,
        username: session.username,
        logoutAt: now,
      });
    }
  }

  /**
   * Lists sessions with optional filtering.
   */
  public async listSessions(filter?: SessionFilter): Promise<Session[]> {
    let result = Array.from(this._sessions.values());

    if (filter?.userId) {
      result = result.filter((s) => s.userId === filter.userId);
    }
    if (filter?.status) {
      result = result.filter((s) => s.status === filter.status);
    }
    if (filter?.limit && filter.limit > 0) {
      result = result.slice(0, filter.limit);
    }

    return result;
  }
}
