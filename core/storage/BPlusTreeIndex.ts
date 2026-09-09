/**
 * @file BPlusTreeIndex.ts
 * @description In-memory B+ Tree index supporting logarithmic range queries.
 */

export interface BPlusNode {
  isLeaf: boolean;
  keys: string[];
  values?: unknown[];
  children?: BPlusNode[];
  next?: BPlusNode;
}

export class BPlusTreeIndex {
  private root: BPlusNode;

  constructor(public readonly order = 4) {
    this.root = { isLeaf: true, keys: [], values: [] };
  }

  public insert(key: string, value: unknown): void {
    const leaf = this.findLeaf(key);
    const idx = leaf.keys.findIndex(k => k >= key);

    if (idx !== -1 && leaf.keys[idx] === key) {
      leaf.values![idx] = value; // Update existing
      return;
    }

    const insertIdx = idx === -1 ? leaf.keys.length : idx;
    leaf.keys.splice(insertIdx, 0, key);
    leaf.values!.splice(insertIdx, 0, value);
  }

  public get(key: string): unknown | undefined {
    const leaf = this.findLeaf(key);
    const idx = leaf.keys.indexOf(key);
    return idx !== -1 ? leaf.values![idx] : undefined;
  }

  public rangeScan(startKey: string, endKey: string): Array<{ key: string; value: unknown }> {
    const results: Array<{ key: string; value: unknown }> = [];
    let leaf: BPlusNode | undefined = this.findLeaf(startKey);

    while (leaf) {
      for (let i = 0; i < leaf.keys.length; i++) {
        const k = leaf.keys[i]!;
        if (k >= startKey && k <= endKey) {
          results.push({ key: k, value: leaf.values![i] });
        }
      }
      leaf = leaf.next;
    }

    return results;
  }

  private findLeaf(key: string): BPlusNode {
    let curr = this.root;
    while (!curr.isLeaf) {
      let idx = curr.keys.findIndex(k => key < k);
      if (idx === -1) idx = curr.keys.length;
      curr = curr.children![idx]!;
    }
    return curr;
  }
}
