import type { EventBus } from '../events/index.js';
import { BaseSystemService } from '../kernel/Service.js';
import type { PermissionManager, PermissionTarget, PermissionType, SecurityContext } from '../permissions/index.js';
import { type NamespaceStorage, StorageEngine } from '../storage/index.js';
import type { TrashManager } from '../trash/index.js';
import type { UserManager } from '../users/index.js';
import { DirectoryTree } from './DirectoryTree.js';
import {
  calculateContentSize,
  createDirectoryMetadata,
  createFileMetadata,
} from './FileMetadata.js';
import { FileSearch } from './FileSearch.js';
import {
  DirectoryAlreadyExistsError,
  DirectoryCycleError,
  DirectoryNotFoundError,
  FileAlreadyExistsError,
  FileNotFoundError,
  FileSystemError,
  IsADirectoryError,
  NotADirectoryError,
  RootOperationError,
} from './FileSystemError.js';
import {
  type FileSystemConfig,
  type ResolvedFileSystemConfig,
  resolveFileSystemConfig,
} from './FileSystemConfig.js';
import { FileWatcherManager } from './FileWatcher.js';
import { PathResolver } from './PathResolver.js';
import type {
  CreateDirectoryOptions,
  CreateFileOptions,
  DeleteOptions,
  FileContent,
  FileEncoding,
  FileListOptions,
  FileMetadata,
  FileSearchOptions,
  FileWatcherCallback,
} from './types.js';

/**
 * WebOS Virtual File System runtime coordinating files, directories, tree indexing,
 * persistence, search, file watchers, and EventBus integration.
 */
export class FileSystem extends BaseSystemService {
  public override readonly name = 'filesystem';
  public override readonly dependencies: readonly string[] = ['storage'];
  public override readonly optionalDependencies: readonly string[] = [
    'event-bus',
    'permissions',
    'users',
  ];

  private readonly _config: ResolvedFileSystemConfig;
  private readonly _tree = new DirectoryTree();
  private readonly _search = new FileSearch(this._tree);
  private readonly _watchers = new FileWatcherManager();

  private _storageEngine!: StorageEngine;
  private _metaStorage!: NamespaceStorage;
  private _contentStorage!: NamespaceStorage;
  private _eventBus?: EventBus;
  private _permissionManager?: PermissionManager;
  private _trashManager?: TrashManager;
  private _userManager?: UserManager;

  constructor(config?: FileSystemConfig) {
    super();
    this._config = resolveFileSystemConfig(config);
    this._eventBus = config?.eventBus;
    this._permissionManager = config?.permissionManager;
    this._trashManager = config?.trashManager;
    this._userManager = config?.userManager;

    if (config?.storage) {
      this.attachStorage(config.storage);
    }
  }

  /**
   * Attaches the StorageEngine instance for metadata and content persistence.
   */
  public attachStorage(storage: StorageEngine): void {
    this._storageEngine = storage;
    this._metaStorage = storage.namespace('vfs_meta');
    this._contentStorage = storage.namespace('vfs_content');
  }

  /**
   * Connects an EventBus instance for filesystem event broadcasting.
   */
  public attachEventBus(eventBus: EventBus): void {
    this._eventBus = eventBus;
  }

  /**
   * Attaches a PermissionManager instance for access control.
   */
  public attachPermissionManager(permissionManager: PermissionManager): void {
    this._permissionManager = permissionManager;
  }

  /**
   * Attaches a TrashManager instance for soft-delete recovery.
   */
  public attachTrashManager(trashManager: TrashManager): void {
    this._trashManager = trashManager;
  }

  /**
   * Attaches a UserManager instance for user identity and ownership.
   */
  public attachUserManager(userManager: UserManager): void {
    this._userManager = userManager;
  }

  private async _assertPermission(
    context: Partial<SecurityContext> | undefined,
    target: PermissionTarget,
    permission: PermissionType
  ): Promise<void> {
    if (this._permissionManager) {
      await this._permissionManager.assertPermission(context ?? {}, target, permission);
    }
  }

  // =========================================================================
  // File CRUD Operations
  // =========================================================================

  /**
   * Creates a new file at the specified path.
   *
   * @param path - Normalized destination path for the file.
   * @param options - Options including content, MIME type, and overwrite flag.
   * @param context - Optional security context for permission validation.
   * @returns Metadata for the created file.
   */
  public async createFile(
    path: string,
    options?: CreateFileOptions,
    context?: Partial<SecurityContext>
  ): Promise<FileMetadata> {
    const normalized = PathResolver.normalize(path);
    if (PathResolver.isRoot(normalized)) {
      throw new RootOperationError('createFile', 'Cannot create file at root path.');
    }

    const name = PathResolver.basename(normalized);
    PathResolver.validateName(name);

    const parentPath = PathResolver.dirname(normalized);
    const parent = this._tree.get(parentPath);
    if (!parent) {
      throw new DirectoryNotFoundError(parentPath);
    }
    if (parent.type !== 'directory') {
      throw new NotADirectoryError(parentPath);
    }

    // Permission Check: require WRITE on parent directory
    await this._assertPermission(
      context,
      {
        id: parent.id,
        path: parentPath,
        ownerId: parent.ownerId,
        mode: parent.mode,
        isDirectory: true,
      },
      'WRITE'
    );

    const existing = this._tree.get(normalized);
    if (existing) {
      if (existing.type === 'directory') {
        throw new IsADirectoryError(normalized);
      }
      if (options?.overwrite) {
        return this.writeFile(
          normalized,
          options.content ?? '',
          { encoding: options.encoding },
          context
        );
      }
      throw new FileAlreadyExistsError(normalized);
    }

    const resolvedOwnerId =
      options?.ownerId ??
      context?.userId ??
      this._userManager?.getCurrentUser()?.id ??
      'user';

    const metadata = createFileMetadata(normalized, parent.id, {
      ...options,
      ownerId: resolvedOwnerId,
    });

    // 1. Persist metadata
    await this._metaStorage.set(metadata.id, metadata);

    // 2. Persist content if provided
    if (options?.content !== undefined) {
      await this._contentStorage.set(metadata.id, options.content);
    }

    // 3. Update in-memory tree index
    this._tree.add(metadata);

    // 4. Emit event and notify watchers
    this._eventBus?.emit(
      'FILE_CREATED',
      { path: metadata.path, size: metadata.size, mimeType: metadata.mimeType },
      { source: 'filesystem' }
    );

    this._watchers.notify({
      type: 'created',
      path: metadata.path,
      nodeType: 'file',
      timestamp: metadata.createdAt,
    });

    return metadata;
  }

  /**
   * Creates a new directory at the specified path.
   */
  public async createDirectory(
    path: string,
    options?: CreateDirectoryOptions,
    context?: Partial<SecurityContext>
  ): Promise<FileMetadata> {
    const normalized = PathResolver.normalize(path);
    if (PathResolver.isRoot(normalized)) {
      const root = this._tree.getRoot();
      if (root) return root;
      const newRoot = createDirectoryMetadata(
        '/',
        null,
        { ownerId: 'system', mode: 0o755 },
        'root_dir'
      );
      await this._metaStorage.set(newRoot.id, newRoot);
      this._tree.add(newRoot);
      return newRoot;
    }

    const name = PathResolver.basename(normalized);
    PathResolver.validateName(name);

    const parentPath = PathResolver.dirname(normalized);
    let parent = this._tree.get(parentPath);

    if (!parent) {
      if (options?.recursive) {
        await this.ensureDirectoryHierarchy(parentPath, context);
        parent = this._tree.get(parentPath);
      } else {
        throw new DirectoryNotFoundError(parentPath);
      }
    }

    if (!parent) {
      throw new DirectoryNotFoundError(parentPath);
    }
    if (parent.type !== 'directory') {
      throw new NotADirectoryError(parentPath);
    }

    // Permission check on parent directory
    await this._assertPermission(
      context,
      {
        id: parent.id,
        path: parentPath,
        ownerId: parent.ownerId,
        mode: parent.mode,
        isDirectory: true,
      },
      'WRITE'
    );

    const existing = this._tree.get(normalized);
    if (existing) {
      if (existing.type === 'directory') {
        if (options?.recursive) {
          return existing;
        }
        throw new DirectoryAlreadyExistsError(normalized);
      }
      throw new FileAlreadyExistsError(normalized);
    }

    const resolvedOwnerId =
      options?.ownerId ??
      context?.userId ??
      this._userManager?.getCurrentUser()?.id ??
      'user';

    const metadata = createDirectoryMetadata(normalized, parent.id, {
      ownerId: resolvedOwnerId,
      mode: options?.mode ?? 0o755,
    });

    // 1. Persist metadata
    await this._metaStorage.set(metadata.id, metadata);

    // 2. Update tree index
    this._tree.add(metadata);

    // 3. Emit event and notify watchers
    this._eventBus?.emit(
      'DIRECTORY_CREATED',
      { path: metadata.path },
      { source: 'filesystem' }
    );

    this._watchers.notify({
      type: 'created',
      path: metadata.path,
      nodeType: 'directory',
      timestamp: metadata.createdAt,
    });

    return metadata;
  }

  /**
   * Reads the content of a file.
   */
  public async readFile(
    path: string,
    options?: { encoding?: FileEncoding },
    context?: Partial<SecurityContext>
  ): Promise<string | Uint8Array | unknown> {
    const normalized = PathResolver.normalize(path);
    const node = this._tree.get(normalized);
    if (!node) {
      throw new FileNotFoundError(normalized);
    }
    if (node.type === 'directory') {
      throw new IsADirectoryError(normalized);
    }

    // Permission check
    await this._assertPermission(
      context,
      {
        id: node.id,
        path: normalized,
        ownerId: node.ownerId,
        mode: node.mode,
        isDirectory: false,
      },
      'READ'
    );

    const raw = await this._contentStorage.get<unknown>(node.id);
    const encoding = options?.encoding ?? 'utf-8';

    if (raw === undefined || raw === null) {
      return encoding === 'binary' ? new Uint8Array() : '';
    }

    if (encoding === 'binary') {
      if (raw instanceof Uint8Array) return raw;
      if (raw instanceof ArrayBuffer) return new Uint8Array(raw);
      if (typeof raw === 'string') {
        return new TextEncoder().encode(raw);
      }
      return new Uint8Array();
    }

    if (encoding === 'json') {
      if (typeof raw === 'string') {
        return JSON.parse(raw);
      }
      return raw;
    }

    // Default: 'utf-8' string
    if (typeof raw === 'string') {
      return raw;
    }
    if (raw instanceof Uint8Array) {
      return new TextDecoder().decode(raw);
    }
    if (raw instanceof ArrayBuffer) {
      return new TextDecoder().decode(new Uint8Array(raw));
    }
    return JSON.stringify(raw);
  }

  /**
   * Writes content to an existing file, or creates it if it doesn't exist.
   */
  public async writeFile(
    path: string,
    content: FileContent,
    options?: { encoding?: FileEncoding },
    context?: Partial<SecurityContext>
  ): Promise<FileMetadata> {
    const normalized = PathResolver.normalize(path);
    const existing = this._tree.get(normalized);

    if (!existing) {
      return this.createFile(
        normalized,
        { content, encoding: options?.encoding },
        context
      );
    }

    if (existing.type === 'directory') {
      throw new IsADirectoryError(normalized);
    }

    // Permission check
    await this._assertPermission(
      context,
      {
        id: existing.id,
        path: normalized,
        ownerId: existing.ownerId,
        mode: existing.mode,
        isDirectory: false,
      },
      'WRITE'
    );

    const now = Date.now();
    const size = calculateContentSize(content);

    const updatedMetadata: FileMetadata = {
      ...existing,
      updatedAt: now,
      size,
    };

    // 1. Persist content
    await this._contentStorage.set(existing.id, content);

    // 2. Persist metadata
    await this._metaStorage.set(existing.id, updatedMetadata);

    // 3. Update in-memory tree
    this._tree.add(updatedMetadata);

    // 4. Emit event and notify watchers
    this._eventBus?.emit(
      'FILE_UPDATED',
      {
        path: updatedMetadata.path,
        size: updatedMetadata.size,
        mimeType: updatedMetadata.mimeType,
        modifiedAt: updatedMetadata.updatedAt,
      },
      { source: 'filesystem' }
    );

    this._watchers.notify({
      type: 'updated',
      path: updatedMetadata.path,
      nodeType: 'file',
      timestamp: updatedMetadata.updatedAt,
    });

    return updatedMetadata;
  }

  /**
   * Appends content to a file. Creates the file if it does not exist.
   */
  public async appendFile(
    path: string,
    content: string | Uint8Array,
    options?: { encoding?: FileEncoding },
    context?: Partial<SecurityContext>
  ): Promise<FileMetadata> {
    const normalized = PathResolver.normalize(path);
    if (!this._tree.has(normalized)) {
      return this.createFile(normalized, { content }, context);
    }

    const existingContent = await this.readFile(
      normalized,
      {
        encoding: content instanceof Uint8Array ? 'binary' : 'utf-8',
      },
      context
    );

    let combined: FileContent;
    if (content instanceof Uint8Array) {
      const prevBuf =
        existingContent instanceof Uint8Array
          ? existingContent
          : new Uint8Array();
      const newBuf = new Uint8Array(prevBuf.byteLength + content.byteLength);
      newBuf.set(prevBuf, 0);
      newBuf.set(content, prevBuf.byteLength);
      combined = newBuf;
    } else {
      combined = `${String(existingContent)}${content}`;
    }

    return this.writeFile(normalized, combined, options, context);
  }

  /**
   * Checks whether a file or directory exists at the given path.
   */
  public async exists(path: string): Promise<boolean> {
    return this._tree.has(PathResolver.normalize(path));
  }

  /**
   * Returns complete metadata for a file or directory.
   */
  public async stat(path: string): Promise<FileMetadata> {
    const normalized = PathResolver.normalize(path);
    const node = this._tree.get(normalized);
    if (!node) {
      throw new FileNotFoundError(normalized);
    }
    return { ...node };
  }

  /**
   * Lists the contents of a directory.
   */
  public async listDirectory(
    path: string,
    options?: FileListOptions,
    context?: Partial<SecurityContext>
  ): Promise<FileMetadata[]> {
    const normalized = PathResolver.normalize(path);
    const parent = this._tree.get(normalized);
    if (!parent) {
      throw new DirectoryNotFoundError(normalized);
    }
    if (parent.type !== 'directory') {
      throw new NotADirectoryError(normalized);
    }

    // Permission check
    await this._assertPermission(
      context,
      {
        id: parent.id,
        path: normalized,
        ownerId: parent.ownerId,
        mode: parent.mode,
        isDirectory: true,
      },
      'READ'
    );

    let items = options?.recursive
      ? this._tree.getDescendants(normalized)
      : this._tree.getChildren(normalized);

    if (!options?.includeHidden) {
      items = items.filter((item) => !item.hidden);
    }

    const sortBy = options?.sortBy ?? 'name';
    const sortOrder = options?.sortOrder ?? 'asc';

    items.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortBy === 'size') cmp = a.size - b.size;
      else if (sortBy === 'createdAt') cmp = a.createdAt - b.createdAt;
      else if (sortBy === 'updatedAt') cmp = a.updatedAt - b.updatedAt;
      else if (sortBy === 'type') cmp = a.type.localeCompare(b.type);

      return sortOrder === 'desc' ? -cmp : cmp;
    });

    return items.map((item) => ({ ...item }));
  }

  // =========================================================================
  // Rename, Move, Copy, Delete
  // =========================================================================

  /**
   * Renames a file or directory.
   */
  public async rename(
    oldPath: string,
    newName: string,
    context?: Partial<SecurityContext>
  ): Promise<FileMetadata> {
    const normalizedOld = PathResolver.normalize(oldPath);
    if (PathResolver.isRoot(normalizedOld)) {
      throw new RootOperationError('rename', 'Cannot rename root directory.');
    }

    PathResolver.validateName(newName);

    const node = this._tree.get(normalizedOld);
    if (!node) {
      throw new FileNotFoundError(normalizedOld);
    }

    const parentPath = PathResolver.dirname(normalizedOld);
    const parent = this._tree.get(parentPath);
    if (parent) {
      await this._assertPermission(
        context,
        {
          id: parent.id,
          path: parentPath,
          ownerId: parent.ownerId,
          mode: parent.mode,
          isDirectory: true,
        },
        'WRITE'
      );
    }

    await this._assertPermission(
      context,
      {
        id: node.id,
        path: normalizedOld,
        ownerId: node.ownerId,
        mode: node.mode,
        isDirectory: node.type === 'directory',
      },
      'WRITE'
    );

    const newPath = PathResolver.join(parentPath, newName);

    if (this._tree.has(newPath)) {
      throw new FileAlreadyExistsError(newPath);
    }

    const now = Date.now();
    const updatedMeta: FileMetadata = {
      ...node,
      name: newName,
      path: newPath,
      extension:
        node.type === 'file'
          ? PathResolver.extname(newName) || undefined
          : undefined,
      mimeType:
        node.type === 'file'
          ? PathResolver.getMimeType(newName)
          : 'inode/directory',
      hidden: newName.startsWith('.'),
      updatedAt: now,
    };

    if (node.type === 'file') {
      this._tree.remove(normalizedOld);
      this._tree.add(updatedMeta);
      await this._metaStorage.set(node.id, updatedMeta);

      this._eventBus?.emit(
        'FILE_RENAMED',
        { oldPath: normalizedOld, newPath },
        { source: 'filesystem' }
      );

      this._watchers.notify({
        type: 'renamed',
        path: newPath,
        oldPath: normalizedOld,
        newPath,
        nodeType: 'file',
        timestamp: now,
      });

      return updatedMeta;
    }

    // Directory rename: update self and all descendant paths
    const descendants = this._tree.getDescendants(normalizedOld);
    const oldPrefix = normalizedOld + '/';
    const newPrefix = newPath + '/';

    this._tree.remove(normalizedOld);
    this._tree.add(updatedMeta);
    await this._metaStorage.set(node.id, updatedMeta);

    for (const desc of descendants) {
      const newDescPath = desc.path.replace(oldPrefix, newPrefix);
      const updatedDesc: FileMetadata = {
        ...desc,
        path: newDescPath,
        updatedAt: now,
      };
      this._tree.remove(desc.path);
      this._tree.add(updatedDesc);
      await this._metaStorage.set(desc.id, updatedDesc);
    }

    this._eventBus?.emit(
      'DIRECTORY_RENAMED',
      { oldPath: normalizedOld, newPath },
      { source: 'filesystem' }
    );

    this._watchers.notify({
      type: 'renamed',
      path: newPath,
      oldPath: normalizedOld,
      newPath,
      nodeType: 'directory',
      timestamp: now,
    });

    return updatedMeta;
  }

  /**
   * Moves a file or directory to a new path.
   */
  public async move(
    sourcePath: string,
    destinationPath: string,
    context?: Partial<SecurityContext>
  ): Promise<FileMetadata> {
    const normSource = PathResolver.normalize(sourcePath);
    const normDest = PathResolver.normalize(destinationPath);

    if (PathResolver.isRoot(normSource)) {
      throw new RootOperationError('move', 'Cannot move root directory.');
    }

    const node = this._tree.get(normSource);
    if (!node) {
      throw new FileNotFoundError(normSource);
    }

    if (normSource === normDest) {
      return node;
    }

    // Prevent moving directory into its own descendant
    if (
      node.type === 'directory' &&
      PathResolver.isSubpath(normSource, normDest)
    ) {
      throw new DirectoryCycleError(normSource, normDest);
    }

    let targetPath = normDest;
    let parentPath = PathResolver.dirname(normDest);

    const destNode = this._tree.get(normDest);
    if (destNode && destNode.type === 'directory') {
      targetPath = PathResolver.join(normDest, node.name);
      parentPath = normDest;
    }

    const parent = this._tree.get(parentPath);
    if (!parent) {
      throw new DirectoryNotFoundError(parentPath);
    }
    if (parent.type !== 'directory') {
      throw new NotADirectoryError(parentPath);
    }

    if (this._tree.has(targetPath)) {
      throw new FileAlreadyExistsError(targetPath);
    }

    // Permission checks
    await this._assertPermission(
      context,
      {
        id: node.id,
        path: normSource,
        ownerId: node.ownerId,
        mode: node.mode,
        isDirectory: node.type === 'directory',
      },
      'WRITE'
    );

    await this._assertPermission(
      context,
      {
        id: parent.id,
        path: parentPath,
        ownerId: parent.ownerId,
        mode: parent.mode,
        isDirectory: true,
      },
      'WRITE'
    );

    const now = Date.now();
    const updatedMeta: FileMetadata = {
      ...node,
      name: PathResolver.basename(targetPath),
      path: targetPath,
      parentId: parent.id,
      updatedAt: now,
    };

    if (node.type === 'file') {
      this._tree.remove(normSource);
      this._tree.add(updatedMeta);
      await this._metaStorage.set(node.id, updatedMeta);

      this._eventBus?.emit(
        'FILE_MOVED',
        { sourcePath: normSource, destinationPath: targetPath },
        { source: 'filesystem' }
      );

      this._watchers.notify({
        type: 'moved',
        path: targetPath,
        oldPath: normSource,
        newPath: targetPath,
        nodeType: 'file',
        timestamp: now,
      });

      return updatedMeta;
    }

    // Directory move: update self and descendants
    const descendants = this._tree.getDescendants(normSource);
    const oldPrefix = normSource + '/';
    const newPrefix = targetPath + '/';

    this._tree.remove(normSource);
    this._tree.add(updatedMeta);
    await this._metaStorage.set(node.id, updatedMeta);

    for (const desc of descendants) {
      const newDescPath = desc.path.replace(oldPrefix, newPrefix);
      const updatedDesc: FileMetadata = {
        ...desc,
        path: newDescPath,
        updatedAt: now,
      };
      this._tree.remove(desc.path);
      this._tree.add(updatedDesc);
      await this._metaStorage.set(desc.id, updatedDesc);
    }

    this._eventBus?.emit(
      'DIRECTORY_MOVED',
      { sourcePath: normSource, destinationPath: targetPath },
      { source: 'filesystem' }
    );

    this._watchers.notify({
      type: 'moved',
      path: targetPath,
      oldPath: normSource,
      newPath: targetPath,
      nodeType: 'directory',
      timestamp: now,
    });

    return updatedMeta;
  }

  /**
   * Copies a file or directory to a new path.
   */
  public async copy(
    sourcePath: string,
    destinationPath: string,
    options?: { overwrite?: boolean },
    context?: Partial<SecurityContext>
  ): Promise<FileMetadata> {
    const normSource = PathResolver.normalize(sourcePath);
    const normDest = PathResolver.normalize(destinationPath);

    if (PathResolver.isRoot(normSource)) {
      throw new RootOperationError('copy', 'Cannot copy root directory.');
    }

    const node = this._tree.get(normSource);
    if (!node) {
      throw new FileNotFoundError(normSource);
    }

    let targetPath = normDest;
    let parentPath = PathResolver.dirname(normDest);

    const destNode = this._tree.get(normDest);
    if (destNode && destNode.type === 'directory') {
      targetPath = PathResolver.join(normDest, node.name);
      parentPath = normDest;
    }

    const parent = this._tree.get(parentPath);
    if (!parent) {
      throw new DirectoryNotFoundError(parentPath);
    }
    if (parent.type !== 'directory') {
      throw new NotADirectoryError(parentPath);
    }

    if (this._tree.has(targetPath)) {
      throw new FileAlreadyExistsError(targetPath);
    }

    // Permission checks: READ source, WRITE destination parent
    await this._assertPermission(
      context,
      {
        id: node.id,
        path: normSource,
        ownerId: node.ownerId,
        mode: node.mode,
        isDirectory: node.type === 'directory',
      },
      'READ'
    );

    await this._assertPermission(
      context,
      {
        id: parent.id,
        path: parentPath,
        ownerId: parent.ownerId,
        mode: parent.mode,
        isDirectory: true,
      },
      'WRITE'
    );

    if (node.type === 'file') {
      const content = await this._contentStorage.get<unknown>(node.id);
      const newFile = await this.createFile(
        targetPath,
        {
          content: content as FileContent,
          mimeType: node.mimeType,
          customMetadata: node.customMetadata
            ? { ...node.customMetadata }
            : undefined,
        },
        context
      );

      this._eventBus?.emit(
        'FILE_COPIED',
        { sourcePath: normSource, destinationPath: targetPath },
        { source: 'filesystem' }
      );

      return newFile;
    }

    // Directory copy: cannot copy directory into its own descendant
    if (PathResolver.isSubpath(normSource, targetPath)) {
      throw new DirectoryCycleError(normSource, targetPath);
    }

    const newDir = await this.createDirectory(targetPath, {}, context);
    const children = this._tree.getChildren(normSource);

    for (const child of children) {
      const childDest = PathResolver.join(targetPath, child.name);
      await this.copy(child.path, childDest, options, context);
    }

    return newDir;
  }

  /**
   * Deletes a file or directory.
   */
  public async delete(
    path: string,
    options?: DeleteOptions,
    context?: Partial<SecurityContext>
  ): Promise<void> {
    const normalized = PathResolver.normalize(path);
    if (PathResolver.isRoot(normalized)) {
      throw new RootOperationError('delete', 'Root directory cannot be deleted.');
    }

    const node = this._tree.get(normalized);
    if (!node) {
      throw new FileNotFoundError(normalized);
    }

    // Permission check
    await this._assertPermission(
      context,
      {
        id: node.id,
        path: normalized,
        ownerId: node.ownerId,
        mode: node.mode,
        isDirectory: node.type === 'directory',
      },
      'WRITE'
    );

    // Check Trash hook or TrashManager if enabled
    if (options?.useTrash !== false) {
      if (this._config.trashHook) {
        const handled = await this._config.trashHook(normalized, node);
        if (handled) {
          return;
        }
      }
      if (this._trashManager) {
        await this._trashManager.moveToTrash(normalized, {
          deletedBy:
            context?.userId ??
            this._userManager?.getCurrentUser()?.id ??
            'user',
        });
        return;
      }
    }

    if (node.type === 'directory') {
      const descendants = this._tree.getDescendants(normalized);
      // Delete descendants in bottom-up order
      for (const desc of descendants.reverse()) {
        if (desc.type === 'file') {
          await this._contentStorage.delete(desc.id);
        }
        await this._metaStorage.delete(desc.id);
        this._tree.remove(desc.path);

        this._watchers.notify({
          type: 'deleted',
          path: desc.path,
          nodeType: desc.type,
          timestamp: Date.now(),
        });
      }

      await this._metaStorage.delete(node.id);
      this._tree.remove(normalized);

      this._eventBus?.emit(
        'DIRECTORY_DELETED',
        { path: normalized, recursive: true },
        { source: 'filesystem' }
      );

      this._watchers.notify({
        type: 'deleted',
        path: normalized,
        nodeType: 'directory',
        timestamp: Date.now(),
      });
      return;
    }

    // File deletion
    await this._contentStorage.delete(node.id);
    await this._metaStorage.delete(node.id);
    this._tree.remove(normalized);

    this._eventBus?.emit(
      'FILE_DELETED',
      { path: normalized },
      { source: 'filesystem' }
    );

    this._watchers.notify({
      type: 'deleted',
      path: normalized,
      nodeType: 'file',
      timestamp: Date.now(),
    });
  }

  /**
   * Sets the owner ID of a file or directory.
   */
  public async setOwner(
    path: string,
    ownerId: string,
    context?: Partial<SecurityContext>
  ): Promise<FileMetadata> {
    const normalized = PathResolver.normalize(path);
    const node = this._tree.get(normalized);
    if (!node) {
      throw new FileNotFoundError(normalized);
    }

    await this._assertPermission(
      context,
      {
        id: node.id,
        path: normalized,
        ownerId: node.ownerId,
        mode: node.mode,
        isDirectory: node.type === 'directory',
      },
      'WRITE'
    );

    const updated: FileMetadata = {
      ...node,
      ownerId,
      updatedAt: Date.now(),
    };

    await this._metaStorage.set(updated.id, updated);
    this._tree.add(updated);
    return updated;
  }

  /**
   * Modifies the permission mode bits of a file or directory.
   */
  public async chmod(
    path: string,
    mode: number,
    context?: Partial<SecurityContext>
  ): Promise<FileMetadata> {
    const normalized = PathResolver.normalize(path);
    const node = this._tree.get(normalized);
    if (!node) {
      throw new FileNotFoundError(normalized);
    }

    await this._assertPermission(
      context,
      {
        id: node.id,
        path: normalized,
        ownerId: node.ownerId,
        mode: node.mode,
        isDirectory: node.type === 'directory',
      },
      'WRITE'
    );

    const updated: FileMetadata = {
      ...node,
      mode,
      updatedAt: Date.now(),
    };

    await this._metaStorage.set(updated.id, updated);
    this._tree.add(updated);
    return updated;
  }

  // =========================================================================
  // Search, Watchers & Tree Traversal
  // =========================================================================

  /**
   * Searches the virtual filesystem.
   */
  public async search(options: FileSearchOptions | string): Promise<FileMetadata[]> {
    return this._search.search(options);
  }

  /**
   * Subscribes a file watcher callback to a path or directory subtree.
   */
  public watch(
    path: string,
    callback: FileWatcherCallback,
    options?: { recursive?: boolean }
  ): () => void {
    return this._watchers.watch(path, callback, options);
  }

  /**
   * Returns metadata for the root directory.
   */
  public getRoot(): FileMetadata {
    const root = this._tree.getRoot();
    if (!root) {
      throw new FileSystemError('Root directory not initialized.');
    }
    return { ...root };
  }

  /**
   * Returns parent metadata for a path.
   */
  public getParent(path: string): FileMetadata | null {
    const parentPath = PathResolver.dirname(PathResolver.normalize(path));
    const parent = this._tree.get(parentPath);
    return parent ? { ...parent } : null;
  }

  /**
   * Returns direct children of a path.
   */
  public getChildren(path: string): FileMetadata[] {
    return this._tree.getChildren(PathResolver.normalize(path)).map((m) => ({ ...m }));
  }

  /**
   * Returns all indexed nodes in the filesystem.
   */
  public getTree(): FileMetadata[] {
    return this._tree.getAllNodes().map((m) => ({ ...m }));
  }

  // =========================================================================
  // Kernel Lifecycle Integration
  // =========================================================================

  protected override async onInitialize(): Promise<void> {
    if (!this._storageEngine) {
      this.attachStorage(new StorageEngine());
    }

    await this._storageEngine.initialize();

    // Rehydrate tree from storage or initialize default filesystem
    const rawKeys = await this._metaStorage.keys();

    if (rawKeys.length > 0) {
      const allMeta = await this._metaStorage.getMany<FileMetadata>(rawKeys);
      for (const meta of allMeta.values()) {
        this._tree.add(meta);
      }
    } else {
      // Create root directory
      const rootMeta = createDirectoryMetadata(
        '/',
        null,
        { ownerId: 'system', mode: 0o755 },
        'root_dir'
      );
      await this._metaStorage.set(rootMeta.id, rootMeta);
      this._tree.add(rootMeta);

      // Create default directory structure
      for (const dirPath of this._config.defaultDirectories) {
        await this.ensureDirectoryHierarchy(dirPath, {
          userId: 'system',
          role: 'ADMIN',
          isSystem: true,
        });
      }
    }
  }

  protected override async onStart(): Promise<void> {
    // FileSystem service running
  }

  protected override async onStop(): Promise<void> {
    this._watchers.clear();
  }

  protected override async onReset(): Promise<void> {
    this._tree.clear();
    this._watchers.clear();
    await this.onInitialize();
  }

  /**
   * Helper to ensure all ancestor directories in a path exist.
   */
  private async ensureDirectoryHierarchy(
    dirPath: string,
    context?: Partial<SecurityContext>
  ): Promise<void> {
    const normalized = PathResolver.normalize(dirPath);
    if (this._tree.has(normalized)) {
      return;
    }

    const segments = normalized.split('/').filter(Boolean);
    let current = '';

    for (const segment of segments) {
      current += '/' + segment;
      if (!this._tree.has(current)) {
        await this.createDirectory(current, {}, context);
      }
    }
  }
}
