/**
 * @file PermissionManager.ts
 * @description Central Permission and Access Control Service for WebOS.
 */

import type { EventBus } from '../events/index.js';
import { BaseSystemService } from '../kernel/Service.js';
import { type NamespaceStorage, StorageEngine } from '../storage/index.js';
import { RoleManager } from '../users/RoleManager.js';
import type { UserManager } from '../users/UserManager.js';
import {
  PermissionDeniedError,
  UnauthorizedOperationError,
} from './PermissionError.js';
import { SecurityPolicy } from './SecurityPolicy.js';
import {
  DEFAULT_MODES,
  type FilePermissions,
  PERMISSION_FLAGS,
  type PermissionManagerConfig,
  type PermissionResult,
  type PermissionTarget,
  type PermissionType,
  type SecurityContext,
} from './types.js';

/**
 * Checks POSIX permission bits for a given mode and permission type.
 */
function checkPosixMode(
  mode: number,
  isOwner: boolean,
  permission: PermissionType
): boolean {
  const flag =
    permission === 'READ'
      ? PERMISSION_FLAGS.READ
      : permission === 'WRITE'
      ? PERMISSION_FLAGS.WRITE
      : PERMISSION_FLAGS.EXECUTE;

  if (isOwner) {
    // Owner bits: (mode >> 6) & 7
    const ownerBits = (mode >> 6) & 7;
    return (ownerBits & flag) !== 0;
  }

  // Others bits: mode & 7
  const otherBits = mode & 7;
  return (otherBits & flag) !== 0;
}

/**
 * WebOS Central Permission Engine.
 */
export class PermissionManager extends BaseSystemService {
  public override readonly name = 'permissions';
  public override readonly dependencies: readonly string[] = ['storage'];
  public override readonly optionalDependencies: readonly string[] = [
    'event-bus',
    'users',
  ];

  private readonly _permissionsCache = new Map<string, FilePermissions>(); // targetId -> FilePermissions

  private _storageEngine?: StorageEngine;
  private _permStorage?: NamespaceStorage;
  private _eventBus?: EventBus;
  private _userManager?: UserManager;

  constructor(config?: PermissionManagerConfig) {
    super();
    this._eventBus = config?.eventBus;
    this._userManager = config?.userManager;

    if (config?.storage) {
      this.attachStorage(config.storage);
    }
  }

  /**
   * Attaches the StorageEngine for persistence.
   */
  public attachStorage(storage: StorageEngine): void {
    this._storageEngine = storage;
    this._permStorage = storage.namespace('permissions');
  }

  /**
   * Attaches the EventBus instance.
   */
  public attachEventBus(eventBus: EventBus): void {
    this._eventBus = eventBus;
  }

  /**
   * Attaches the UserManager instance.
   */
  public attachUserManager(userManager: UserManager): void {
    this._userManager = userManager;
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

    if (this._permStorage) {
      const keys = await this._permStorage.keys();
      if (keys.length > 0) {
        const persisted = await this._permStorage.getMany<FilePermissions>(keys);
        for (const perm of persisted.values()) {
          if (perm && perm.targetId) {
            this._permissionsCache.set(perm.targetId, perm);
          }
        }
      }
    }
  }

  protected override async onStop(): Promise<void> {
    this._permissionsCache.clear();
  }

  // =========================================================================
  // Permission Checks & Evaluations
  // =========================================================================

  /**
   * Resolves a complete SecurityContext, filling in role and user info if missing.
   */
  public resolveContext(context?: Partial<SecurityContext>): SecurityContext {
    if (context?.isSystem) {
      return { userId: context.userId ?? 'system', role: 'ADMIN', isSystem: true };
    }

    if (context?.userId) {
      let role = context.role;
      if (!role && this._userManager) {
        const user = this._userManager.getUserSync(context.userId);
        if (user) {
          role = user.role;
        }
      }
      return {
        userId: context.userId,
        role: role ?? 'USER',
        isSystem: false,
      };
    }

    // Fall back to current user in active session
    if (this._userManager) {
      const currentUser = this._userManager.getCurrentUser();
      if (currentUser) {
        return {
          userId: currentUser.id,
          role: currentUser.role,
          isSystem: false,
        };
      }
    }

    // Anonymous fallback
    return {
      userId: 'anonymous',
      role: 'GUEST',
      isSystem: false,
    };
  }

  /**
   * Checks if a security context has permission on a target resource.
   */
  public async checkPermission(
    context: Partial<SecurityContext>,
    target: PermissionTarget,
    permission: PermissionType
  ): Promise<PermissionResult> {
    const resolvedContext = this.resolveContext(context);

    // 1. Kernel / System internal bypass
    if (resolvedContext.isSystem) {
      return { allowed: true };
    }

    // 2. Administrators have root access
    if (RoleManager.isAdmin(resolvedContext.role)) {
      return { allowed: true };
    }

    // 3. Centralized System Security Policy
    const policyResult = SecurityPolicy.evaluatePolicy(
      resolvedContext,
      target,
      permission
    );
    if (!policyResult.allowed) {
      return policyResult;
    }

    // 4. Retrieve stored or target permissions
    const targetId = target.id ?? target.path;
    let permissions = targetId ? this._permissionsCache.get(targetId) : undefined;
    if (!permissions && target.permissions) {
      permissions = target.permissions;
    }

    const ownerId = permissions?.ownerId ?? target.ownerId;
    const mode =
      permissions?.mode ??
      target.mode ??
      (target.isDirectory ? DEFAULT_MODES.DIRECTORY : DEFAULT_MODES.FILE);

    const isOwner = Boolean(ownerId && ownerId === resolvedContext.userId);

    // 5. Custom ACL check (per-user explicit grants)
    if (permissions?.acl && resolvedContext.userId) {
      const userAcl = permissions.acl[resolvedContext.userId];
      if (userAcl) {
        if (userAcl.includes(permission)) {
          return { allowed: true };
        }
      }
    }

    // 6. POSIX Mode bits evaluation
    const posixAllowed = checkPosixMode(mode, isOwner, permission);
    if (posixAllowed) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: isOwner
        ? `Owner does not have ${permission} permission in mode 0o${mode.toString(8)}`
        : `Caller '${resolvedContext.userId}' does not have ${permission} permission (mode: 0o${mode.toString(8)})`,
    };
  }

  /**
   * Returns a boolean indicating whether permission is granted.
   */
  public async hasPermission(
    context: Partial<SecurityContext>,
    target: PermissionTarget,
    permission: PermissionType
  ): Promise<boolean> {
    const result = await this.checkPermission(context, target, permission);
    return result.allowed;
  }

  /**
   * Asserts permission on a target, throwing PermissionDeniedError and emitting event if denied.
   */
  public async assertPermission(
    context: Partial<SecurityContext>,
    target: PermissionTarget,
    permission: PermissionType
  ): Promise<void> {
    const resolvedContext = this.resolveContext(context);
    const result = await this.checkPermission(resolvedContext, target, permission);

    const targetLabel = target.path ?? target.id ?? 'unknown_resource';

    if (!result.allowed) {
      if (this._eventBus) {
        this._eventBus.emit('PERMISSION_DENIED', {
          permission,
          targetId: targetLabel,
          requestedBy: resolvedContext.userId,
          reason: result.reason,
        });
      }

      throw new PermissionDeniedError(
        targetLabel,
        permission,
        resolvedContext.userId,
        result.reason
      );
    }
  }

  // =========================================================================
  // Permission Modification Operations
  // =========================================================================

  /**
   * Grants custom ACL permissions to a user on a target resource.
   */
  public async grantPermission(
    targetId: string,
    granteeId: string,
    permissionsToGrant: PermissionType[],
    grantorContext: Partial<SecurityContext>
  ): Promise<void> {
    const resolvedGrantor = this.resolveContext(grantorContext);
    const existing = await this.getNodePermissions(targetId);

    // Only owner or admin can grant permissions
    if (
      !resolvedGrantor.isSystem &&
      !RoleManager.isAdmin(resolvedGrantor.role) &&
      existing &&
      existing.ownerId !== resolvedGrantor.userId
    ) {
      throw new UnauthorizedOperationError(
        'grantPermission',
        'Only resource owner or administrator can grant permissions'
      );
    }

    const currentAcl = { ...(existing?.acl ?? {}) };
    const userPerms = new Set(currentAcl[granteeId] ?? []);
    for (const p of permissionsToGrant) {
      userPerms.add(p);
    }
    currentAcl[granteeId] = Array.from(userPerms);

    const updated: FilePermissions = {
      targetId,
      ownerId: existing?.ownerId ?? resolvedGrantor.userId,
      mode: existing?.mode ?? DEFAULT_MODES.FILE,
      acl: Object.freeze(currentAcl),
    };

    this._permissionsCache.set(targetId, updated);

    if (this._permStorage) {
      await this._permStorage.set(targetId, updated);
    }

    if (this._eventBus) {
      for (const p of permissionsToGrant) {
        this._eventBus.emit('PERMISSION_GRANTED', {
          permission: p,
          targetId,
          grantedTo: granteeId,
        });
      }
    }
  }

  /**
   * Revokes custom ACL permissions from a user on a target resource.
   */
  public async revokePermission(
    targetId: string,
    granteeId: string,
    permissionsToRevoke: PermissionType[],
    revokerContext: Partial<SecurityContext>
  ): Promise<void> {
    const resolvedRevoker = this.resolveContext(revokerContext);
    const existing = await this.getNodePermissions(targetId);

    if (
      !resolvedRevoker.isSystem &&
      !RoleManager.isAdmin(resolvedRevoker.role) &&
      existing &&
      existing.ownerId !== resolvedRevoker.userId
    ) {
      throw new UnauthorizedOperationError(
        'revokePermission',
        'Only resource owner or administrator can revoke permissions'
      );
    }

    if (!existing || !existing.acl || !existing.acl[granteeId]) {
      return;
    }

    const currentAcl = { ...existing.acl };
    const userPerms = new Set(currentAcl[granteeId]);
    for (const p of permissionsToRevoke) {
      userPerms.delete(p);
    }

    if (userPerms.size === 0) {
      delete currentAcl[granteeId];
    } else {
      currentAcl[granteeId] = Array.from(userPerms);
    }

    const updated: FilePermissions = {
      ...existing,
      acl: Object.freeze(currentAcl),
    };

    this._permissionsCache.set(targetId, updated);

    if (this._permStorage) {
      await this._permStorage.set(targetId, updated);
    }

    if (this._eventBus) {
      for (const p of permissionsToRevoke) {
        this._eventBus.emit('PERMISSION_REVOKED', {
          permission: p,
          targetId,
          revokedFrom: granteeId,
        });
      }
    }
  }

  /**
   * Sets or transfers ownership of a resource.
   */
  public async setOwner(
    targetId: string,
    newOwnerId: string,
    context: Partial<SecurityContext>
  ): Promise<void> {
    const resolvedContext = this.resolveContext(context);
    const existing = await this.getNodePermissions(targetId);

    if (
      !resolvedContext.isSystem &&
      !RoleManager.isAdmin(resolvedContext.role) &&
      existing &&
      existing.ownerId !== resolvedContext.userId
    ) {
      throw new UnauthorizedOperationError(
        'setOwner',
        'Only resource owner or administrator can change ownership'
      );
    }

    const updated: FilePermissions = {
      targetId,
      ownerId: newOwnerId,
      mode: existing?.mode ?? DEFAULT_MODES.FILE,
      acl: existing?.acl,
    };

    this._permissionsCache.set(targetId, updated);

    if (this._permStorage) {
      await this._permStorage.set(targetId, updated);
    }
  }

  /**
   * Retrieves permissions record for a target node.
   */
  public async getNodePermissions(targetId: string): Promise<FilePermissions | null> {
    return this._permissionsCache.get(targetId) ?? null;
  }

  /**
   * Sets node mode or ACL permissions.
   */
  public async setNodePermissions(
    targetId: string,
    permissions: Partial<FilePermissions>,
    context: Partial<SecurityContext>
  ): Promise<FilePermissions> {
    const resolvedContext = this.resolveContext(context);
    const existing = await this.getNodePermissions(targetId);

    if (
      !resolvedContext.isSystem &&
      !RoleManager.isAdmin(resolvedContext.role) &&
      existing &&
      existing.ownerId !== resolvedContext.userId
    ) {
      throw new UnauthorizedOperationError(
        'setNodePermissions',
        'Only resource owner or administrator can modify node permissions'
      );
    }

    const updated: FilePermissions = {
      targetId,
      ownerId: permissions.ownerId ?? existing?.ownerId ?? resolvedContext.userId,
      groupId: permissions.groupId ?? existing?.groupId,
      mode: permissions.mode ?? existing?.mode ?? DEFAULT_MODES.FILE,
      acl: permissions.acl ?? existing?.acl,
    };

    this._permissionsCache.set(targetId, updated);

    if (this._permStorage) {
      await this._permStorage.set(targetId, updated);
    }

    return updated;
  }
}
