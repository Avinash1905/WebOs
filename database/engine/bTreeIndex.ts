/**
 * WebOS Database Engine - B-Tree Index Implementation
 * Provides logarithmic O(log N) search, insertion, and range scans for database columns.
 */

export class BTreeNode<K, V> {
  public keys: K[] = [];
  public values: V[][] = []; // Support non-unique index values (array per key)
  public children: BTreeNode<K, V>[] = [];
  public isLeaf: boolean = true;

  constructor(isLeaf: boolean = true) {
    this.isLeaf = isLeaf;
  }
}

export class BTreeIndex<K = string | number, V = string | number> {
  public readonly order: number; // Max children = order, max keys = order - 1
  private root: BTreeNode<K, V>;

  constructor(order: number = 4) {
    this.order = Math.max(3, order);
    this.root = new BTreeNode<K, V>(true);
  }

  public search(key: K): V[] | null {
    return this.searchNode(this.root, key);
  }

  private searchNode(node: BTreeNode<K, V>, key: K): V[] | null {
    let i = 0;
    while (i < node.keys.length && key > node.keys[i]) {
      i++;
    }

    if (i < node.keys.length && key === node.keys[i]) {
      return node.values[i];
    }

    if (node.isLeaf) {
      return null;
    }

    return this.searchNode(node.children[i], key);
  }

  public insert(key: K, value: V): void {
    const root = this.root;
    const maxKeys = this.order - 1;

    if (root.keys.length === maxKeys) {
      const newRoot = new BTreeNode<K, V>(false);
      newRoot.children.push(this.root);
      this.splitChild(newRoot, 0, this.root);
      this.root = newRoot;
      this.insertNonFull(newRoot, key, value);
    } else {
      this.insertNonFull(root, key, value);
    }
  }

  private insertNonFull(node: BTreeNode<K, V>, key: K, value: V): void {
    let i = node.keys.length - 1;

    if (node.isLeaf) {
      while (i >= 0 && key < node.keys[i]) {
        i--;
      }

      if (i >= 0 && key === node.keys[i]) {
        node.values[i].push(value);
        return;
      }

      node.keys.splice(i + 1, 0, key);
      node.values.splice(i + 1, 0, [value]);
    } else {
      while (i >= 0 && key < node.keys[i]) {
        i--;
      }

      if (i >= 0 && key === node.keys[i]) {
        node.values[i].push(value);
        return;
      }

      i++;
      if (node.children[i].keys.length === this.order - 1) {
        this.splitChild(node, i, node.children[i]);
        if (key > node.keys[i]) {
          i++;
        }
      }
      this.insertNonFull(node.children[i], key, value);
    }
  }

  private splitChild(parent: BTreeNode<K, V>, index: number, child: BTreeNode<K, V>): void {
    const t = Math.floor(this.order / 2);
    const sibling = new BTreeNode<K, V>(child.isLeaf);

    // Sibling gets keys after median
    sibling.keys = child.keys.splice(t + 1);
    sibling.values = child.values.splice(t + 1);

    if (!child.isLeaf) {
      sibling.children = child.children.splice(t + 1);
    }

    const medianKey = child.keys.pop()!;
    const medianVal = child.values.pop()!;

    parent.children.splice(index + 1, 0, sibling);
    parent.keys.splice(index, 0, medianKey);
    parent.values.splice(index, 0, medianVal);
  }

  public rangeScan(minKey: K, maxKey: K): V[] {
    const results: V[] = [];
    this.scanNode(this.root, minKey, maxKey, results);
    return results;
  }

  private scanNode(node: BTreeNode<K, V>, min: K, max: K, acc: V[]): void {
    let i = 0;
    while (i < node.keys.length) {
      if (!node.isLeaf && node.keys[i] >= min) {
        this.scanNode(node.children[i], min, max, acc);
      }
      if (node.keys[i] >= min && node.keys[i] <= max) {
        acc.push(...node.values[i]);
      }
      if (node.keys[i] > max) break;
      i++;
    }

    if (!node.isLeaf && i < node.children.length) {
      this.scanNode(node.children[i], min, max, acc);
    }
  }
}
