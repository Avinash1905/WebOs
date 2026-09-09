/**
 * @file DirectoryHashTable.ts
 * @description Hashed directory table (dirhash) for O(1) filename indexing in large directories.
 */

export class DirectoryHashTable {
  private readonly table = new Map<string, number>(); // filename -> inodeNumber

  public insert(filename: string, ino: number): void {
    this.table.set(filename, ino);
  }

  public lookup(filename: string): number | undefined {
    return this.table.get(filename);
  }

  public remove(filename: string): boolean {
    return this.table.delete(filename);
  }

  public listNames(): readonly string[] {
    return Array.from(this.table.keys());
  }

  public size(): number {
    return this.table.size;
  }
}
