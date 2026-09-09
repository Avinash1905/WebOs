/**
 * @file PathTraversalTree.ts
 * @description Trie-based path indexing and fast glob matcher.
 */

export interface PathTrieNode {
  readonly segment: string;
  readonly children: Map<string, PathTrieNode>;
  isLeaf: boolean;
  metadata?: unknown;
}

export class PathTraversalTree {
  private readonly root: PathTrieNode = { segment: '', children: new Map(), isLeaf: false };

  public insertPath(path: string, metadata?: unknown): void {
    const segments = path.split('/').filter(Boolean);
    let curr = this.root;

    for (const seg of segments) {
      let child = curr.children.get(seg);
      if (!child) {
        child = { segment: seg, children: new Map(), isLeaf: false };
        curr.children.set(seg, child);
      }
      curr = child;
    }

    curr.isLeaf = true;
    curr.metadata = metadata;
  }

  public matchPrefix(prefix: string): readonly string[] {
    const segments = prefix.split('/').filter(Boolean);
    let curr: PathTrieNode | undefined = this.root;

    for (const seg of segments) {
      curr = curr.children.get(seg);
      if (!curr) return [];
    }

    const matches: string[] = [];
    this.collectPaths(curr, prefix === '/' ? '' : prefix, matches);
    return matches;
  }

  private collectPaths(node: PathTrieNode, currentPath: string, results: string[]): void {
    if (node.isLeaf) results.push(currentPath || '/');

    for (const [seg, child] of node.children.entries()) {
      this.collectPaths(child, `${currentPath}/${seg}`, results);
    }
  }
}
