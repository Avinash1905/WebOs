/**
 * @file SmpCoreBarrier.ts
 * @description Symmetric Multi-Processing (SMP) memory barriers and inter-core synchronizations.
 */

export class SmpCoreBarrier {
  private _generation = 0;
  private _arrived = 0;
  private readonly _coreCount: number;

  constructor(coreCount: number = 4) {
    this._coreCount = coreCount;
  }

  public arriveAndWait(): { generation: number; isLeader: boolean } {
    this._arrived++;
    const currentGen = this._generation;

    if (this._arrived >= this._coreCount) {
      this._arrived = 0;
      this._generation++;
      return { generation: currentGen, isLeader: true };
    }

    return { generation: currentGen, isLeader: false };
  }

  public get generation(): number {
    return this._generation;
  }

  public get coreCount(): number {
    return this._coreCount;
  }
}
