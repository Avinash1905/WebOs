/**
 * WebOS Distributed Hash Table (DHT) Chord Ring Protocol
 */

export interface ChordNode {
  id: number;
  address: string;
  fingerTable: number[];
  predecessor: number | null;
  successor: number;
}

export class ChordDHT {
  private nodes: Map<number, ChordNode> = new Map();
  private ringSize = 65536; // 16-bit keyspace

  public join(nodeId: number, address: string): ChordNode {
    const node: ChordNode = {
      id: nodeId % this.ringSize,
      address,
      fingerTable: [],
      predecessor: null,
      successor: nodeId % this.ringSize,
    };

    // Calculate fingers: (nodeId + 2^i) mod ringSize
    for (let i = 0; i < 16; i++) {
      node.fingerTable.push((node.id + Math.pow(2, i)) % this.ringSize);
    }

    this.nodes.set(node.id, node);
    this.stabilizeRing();
    return node;
  }

  public lookup(key: number): ChordNode | undefined {
    const sortedKeys = Array.from(this.nodes.keys()).sort((a, b) => a - b);
    for (const id of sortedKeys) {
      if (id >= (key % this.ringSize)) {
        return this.nodes.get(id);
      }
    }
    return sortedKeys.length > 0 ? this.nodes.get(sortedKeys[0]) : undefined;
  }

  private stabilizeRing(): void {
    const sorted = Array.from(this.nodes.keys()).sort((a, b) => a - b);
    for (let i = 0; i < sorted.length; i++) {
      const current = this.nodes.get(sorted[i])!;
      current.successor = sorted[(i + 1) % sorted.length];
      current.predecessor = sorted[(i - 1 + sorted.length) % sorted.length];
    }
  }

  public getNodeCount(): number {
    return this.nodes.size;
  }
}

export const chordDHT = new ChordDHT();
