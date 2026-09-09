/**
 * @file OverlayFileSystem.ts
 * @description OverlayFS union mount layer: lower read-only layer and upper read-write layer with whiteout deletion.
 */

export class OverlayFileSystem {
  private readonly _lower = new Map<string, string>(); // Path -> Content (Read-Only)
  private readonly _upper = new Map<string, string>(); // Path -> Content (Read-Write)
  private readonly _whiteouts = new Set<string>();     // Deleted paths from lower layer

  public mountLower(files: Record<string, string>): void {
    for (const [p, c] of Object.entries(files)) {
      this._lower.set(p, c);
    }
  }

  public readFile(path: string): string | null {
    if (this._whiteouts.has(path)) return null;
    if (this._upper.has(path)) return this._upper.get(path)!;
    if (this._lower.has(path)) return this._lower.get(path)!;
    return null;
  }

  public writeFile(path: string, content: string): void {
    this._whiteouts.delete(path);
    this._upper.set(path, content);
  }

  public unlink(path: string): boolean {
    if (!this.exists(path)) return false;

    this._upper.delete(path);
    if (this._lower.has(path)) {
      this._whiteouts.add(path); // Mark whiteout
    }
    return true;
  }

  public exists(path: string): boolean {
    if (this._whiteouts.has(path)) return false;
    return this._upper.has(path) || this._lower.has(path);
  }

  public listFiles(): string[] {
    const keys = new Set<string>();
    for (const k of this._lower.keys()) {
      if (!this._whiteouts.has(k)) keys.add(k);
    }
    for (const k of this._upper.keys()) {
      keys.add(k);
    }
    return Array.from(keys);
  }
}
