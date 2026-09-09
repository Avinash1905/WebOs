/**
 * @file ResourceBudgetManager.ts
 * @description Global system resource budgeting and pool allocation.
 */

export interface SystemResourceBudget {
  readonly maxMemoryBytes: number;
  readonly maxOpenFileDescriptors: number;
  readonly maxProcesses: number;
}

export class ResourceBudgetManager {
  private budget: SystemResourceBudget;
  private allocatedMemory = 0;
  private allocatedDescriptors = 0;
  public allocatedProcesses = 0;

  constructor(budget?: Partial<SystemResourceBudget>) {
    this.budget = {
      maxMemoryBytes: budget?.maxMemoryBytes ?? 512 * 1024 * 1024, // 512MB
      maxOpenFileDescriptors: budget?.maxOpenFileDescriptors ?? 1024,
      maxProcesses: budget?.maxProcesses ?? 128
    };
  }

  public requestMemory(bytes: number): boolean {
    if (this.allocatedMemory + bytes > this.budget.maxMemoryBytes) return false;
    this.allocatedMemory += bytes;
    return true;
  }

  public releaseMemory(bytes: number): void {
    this.allocatedMemory = Math.max(0, this.allocatedMemory - bytes);
  }

  public requestDescriptor(): boolean {
    if (this.allocatedDescriptors >= this.budget.maxOpenFileDescriptors) return false;
    this.allocatedDescriptors++;
    return true;
  }

  public releaseDescriptor(): void {
    this.allocatedDescriptors = Math.max(0, this.allocatedDescriptors - 1);
  }

  public getBudgetSummary(): {
    memoryUsed: number;
    memoryMax: number;
    descriptorsUsed: number;
    descriptorsMax: number;
    processesUsed: number;
    processesMax: number;
  } {
    return {
      memoryUsed: this.allocatedMemory,
      memoryMax: this.budget.maxMemoryBytes,
      descriptorsUsed: this.allocatedDescriptors,
      descriptorsMax: this.budget.maxOpenFileDescriptors,
      processesUsed: this.allocatedProcesses,
      processesMax: this.budget.maxProcesses
    };
  }
}
