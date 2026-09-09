/**
 * WebOS Vector Clock Causal Consistency & Partial Order Ordering Engine
 */

export class VectorClock {
  private clock: Map<string, number> = new Map();

  constructor(public readonly nodeId: string) {
    this.clock.set(nodeId, 0);
  }

  public tick(): VectorClock {
    const current = this.clock.get(this.nodeId) || 0;
    this.clock.set(this.nodeId, current + 1);
    return this.clone();
  }

  public merge(other: VectorClock): void {
    for (const [node, count] of other.clock.entries()) {
      const local = this.clock.get(node) || 0;
      this.clock.set(node, Math.max(local, count));
    }
  }

  public compare(other: VectorClock): 'EQUAL' | 'BEFORE' | 'AFTER' | 'CONCURRENT' {
    let hasLess = false;
    let hasGreater = false;

    const allNodes = new Set([...this.clock.keys(), ...other.clock.keys()]);
    for (const node of allNodes) {
      const c1 = this.clock.get(node) || 0;
      const c2 = other.clock.get(node) || 0;
      if (c1 < c2) hasLess = true;
      if (c1 > c2) hasGreater = true;
    }

    if (!hasLess && !hasGreater) return 'EQUAL';
    if (hasLess && !hasGreater) return 'BEFORE';
    if (!hasLess && hasGreater) return 'AFTER';
    return 'CONCURRENT';
  }

  public clone(): VectorClock {
    const copy = new VectorClock(this.nodeId);
    for (const [k, v] of this.clock.entries()) copy.clock.set(k, v);
    return copy;
  }

  public toJSON(): Record<string, number> {
    const obj: Record<string, number> = {};
    for (const [k, v] of this.clock.entries()) obj[k] = v;
    return obj;
  }
}
