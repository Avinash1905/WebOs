/**
 * @file EnergyAwareScheduler.ts
 * @description Energy-Aware Scheduling (EAS) model for heterogeneous multi-core architecture.
 */

export interface EnergyCore {
  readonly id: number;
  readonly type: 'EFFICIENCY' | 'PERFORMANCE';
  readonly maxCapacity: number; // e.g. 512 for E-core, 1024 for P-core
  readonly energyPerCycle: number; // milliwatts
  currentLoad: number;
}

export class EnergyAwareScheduler {
  private readonly _cores: EnergyCore[] = [];

  constructor(coreConfig?: EnergyCore[]) {
    if (coreConfig && coreConfig.length > 0) {
      this._cores = coreConfig;
    } else {
      // Default: 4 E-cores, 4 P-cores
      for (let i = 0; i < 4; i++) {
        this._cores.push({ id: i, type: 'EFFICIENCY', maxCapacity: 512, energyPerCycle: 1.0, currentLoad: 0 });
      }
      for (let i = 4; i < 8; i++) {
        this._cores.push({ id: i, type: 'PERFORMANCE', maxCapacity: 1024, energyPerCycle: 3.5, currentLoad: 0 });
      }
    }
  }

  /**
   * Selects the most energy-efficient core capable of running a task with given required capacity.
   */
  public selectBestCore(taskCapacity: number, preferPerformance: boolean = false): number {
    let bestCoreId = -1;
    let minEnergyCost = Infinity;

    const candidates = preferPerformance
      ? this._cores.filter((c) => c.type === 'PERFORMANCE')
      : this._cores;

    for (const core of candidates) {
      const remaining = core.maxCapacity - core.currentLoad;
      if (remaining >= taskCapacity) {
        // Calculate projected energy cost: (load + task) * energyPerCycle
        const projectedEnergy = (core.currentLoad + taskCapacity) * core.energyPerCycle;
        if (projectedEnergy < minEnergyCost) {
          minEnergyCost = projectedEnergy;
          bestCoreId = core.id;
        }
      }
    }

    // Fallback to least loaded core if no core has sufficient remaining capacity
    if (bestCoreId === -1) {
      let minLoad = Infinity;
      for (const core of this._cores) {
        if (core.currentLoad < minLoad) {
          minLoad = core.currentLoad;
          bestCoreId = core.id;
        }
      }
    }

    return bestCoreId;
  }

  public assignTask(coreId: number, load: number): void {
    const core = this._cores.find((c) => c.id === coreId);
    if (core) {
      core.currentLoad += load;
    }
  }

  public releaseTask(coreId: number, load: number): void {
    const core = this._cores.find((c) => c.id === coreId);
    if (core) {
      core.currentLoad = Math.max(0, core.currentLoad - load);
    }
  }

  public getCores(): readonly EnergyCore[] {
    return this._cores;
  }
}
