/**
 * @file StorageAdapter.ts
 * @description Common contract for WebOS storage backends (IndexedDB, Memory, etc.).
 */

/**
 * Interface that every WebOS storage adapter must implement.
 */
export interface StorageAdapter {
  /**
   * Unique name of the storage adapter (e.g., 'indexeddb', 'memory').
   */
  readonly name: string;

  /**
   * Initializes connection and sets up stores/tables.
   */
  initialize(): Promise<void>;

  /**
   * Retrieves a value by key. Returns undefined if the key does not exist.
   */
  get<T = unknown>(key: string): Promise<T | undefined>;

  /**
   * Persists a key-value pair.
   */
  set<T = unknown>(key: string, value: T): Promise<void>;

  /**
   * Deletes a key from storage.
   */
  delete(key: string): Promise<void>;

  /**
   * Checks whether a key exists in storage.
   */
  has(key: string): Promise<boolean>;

  /**
   * Clears all stored keys in this adapter.
   */
  clear(): Promise<void>;

  /**
   * Lists all stored keys, optionally filtered by prefix.
   */
  keys(prefix?: string): Promise<string[]>;

  /**
   * Batch retrieval of multiple keys.
   */
  getMany<T = unknown>(keys: readonly string[]): Promise<Map<string, T>>;

  /**
   * Batch write of multiple key-value pairs.
   */
  setMany<T = unknown>(entries: readonly (readonly [string, T])[]): Promise<void>;

  /**
   * Batch deletion of multiple keys.
   */
  deleteMany(keys: readonly string[]): Promise<void>;

  /**
   * Closes active connections and releases resources.
   */
  close(): Promise<void>;
}
