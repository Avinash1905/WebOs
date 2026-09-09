/**
 * @file NUMATopologyScheduler.ts
 * @description Non-Uniform Memory Access (NUMA) node topology affinity and latency balancing.
 */

export interface NUMANode {
  readonly nodeId: number;
  readonly cpuIds: readonly number[];
  readonly totalMemoryBytes: number;
  allocatedMemoryBytes: number;
  readonly distanceMatrix: readonly number[]; // Latency distance to other nodes
}

export class NUMATopologyScheduler {
  private readonly _nodes = new Map<number, NUMANode>();

  constructor() {
    // Default 2-node NUMA configuration
    this._nodes.set(0, {
      nodeId: 0,
      cpuIds: [0, 1, 2, 3],
      totalMemoryBytes: 4 * 1024 * 1024 * 1024,
      allocatedMemoryBytes: 0,
      distanceMatrix: [10, 20], // Local: 10, Remote: 20
    });
    this._nodes.set(1, {
      nodeId: 1,
      cpuIds: [4, 5, 6, 7],
      totalMemoryBytes: 4 * 1024 * 1024 * 1024,
      allocatedMemoryBytes: 0,
      distanceMatrix: [20, 10], // Remote: 20, Local: 10
    });
  }

  public findBestNodeForAllocation(preferredNodeId: number, bytes: number): number {
    const preferred = this._nodes.get(preferredNodeId);
    if (preferred && (preferred.totalMemoryBytes - preferred.allocatedMemoryBytes) >= bytes) {
      return preferredNodeId;
    }

    // Find closest node with sufficient memory
    let bestNode = -1;
    let minDistance = Infinity;

    for (const [nodeId, node] of this._nodes.entries()) {
      if ((node.totalMemoryBytes - node.allocatedMemoryBytes) >= bytes) {
        const distance = preferred ? preferred.distanceMatrix[nodeId] ?? 100 : 100;
        if (distance < minDistance) {
          minDistance = distance;
          bestNode = nodeId;
        }
      }
    }

    return bestNode !== -1 ? bestNode : preferredNodeId;
  }

  public allocateMemory(nodeId: number, bytes: number): boolean {
    const node = this._nodes.get(nodeId);
    if (!node) return false;
    if (node.totalMemoryBytes - node.allocatedMemoryBytes < bytes) return false;
    node.allocatedMemoryBytes += bytes;
    return true;
  }

  public freeMemory(nodeId: number, bytes: number): void {
    const node = this._nodes.get(nodeId);
    if (node) {
      node.allocatedMemoryBytes = Math.max(0, node.allocatedMemoryBytes - bytes);
    }
  }

  public getNode(nodeId: number): NUMANode | undefined {
    return this._nodes.get(nodeId);
  }
}
