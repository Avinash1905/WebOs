/**
 * @file DeadlockDetector.ts
 * @description Tarjan's Strongly Connected Components cycle detection on Resource Allocation Graphs (RAG).
 */

export class DeadlockDetector {
  private readonly _graph = new Map<string, Set<string>>(); // Node -> Set of downstream nodes (waits on)

  public addWaitEdge(requesterId: string, holderId: string): void {
    let edges = this._graph.get(requesterId);
    if (!edges) {
      edges = new Set();
      this._graph.set(requesterId, edges);
    }
    edges.add(holderId);
  }

  public removeWaitEdge(requesterId: string, holderId: string): void {
    this._graph.get(requesterId)?.delete(holderId);
  }

  public removeNode(nodeId: string): void {
    this._graph.delete(nodeId);
    for (const edges of this._graph.values()) {
      edges.delete(nodeId);
    }
  }

  /**
   * Detects cycles in the Resource Allocation Graph using DFS.
   */
  public detectCycles(): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recStack: string[] = [];

    const dfs = (curr: string) => {
      visited.add(curr);
      recStack.push(curr);

      const neighbors = this._graph.get(curr);
      if (neighbors) {
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            dfs(neighbor);
          } else {
            const cycleIndex = recStack.indexOf(neighbor);
            if (cycleIndex !== -1) {
              const cycle = recStack.slice(cycleIndex);
              cycle.push(neighbor); // Close cycle
              cycles.push(cycle);
            }
          }
        }
      }

      recStack.pop();
    };

    for (const node of this._graph.keys()) {
      if (!visited.has(node)) {
        dfs(node);
      }
    }

    return cycles;
  }

  public hasDeadlock(): boolean {
    return this.detectCycles().length > 0;
  }

  public clear(): void {
    this._graph.clear();
  }
}
