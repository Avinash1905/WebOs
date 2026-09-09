/**
 * @file ProcessPriority.ts
 * @description Process priority definitions, weight mappings, and slice multipliers.
 */

import type { ProcessPriority } from '../process/index.js';

export const PRIORITY_WEIGHTS: Record<ProcessPriority, number> = {
  CRITICAL: 5,
  HIGH: 4,
  NORMAL: 3,
  LOW: 2,
  IDLE: 1,
} as const;

export const PRIORITY_SLICE_MULTIPLIERS: Record<ProcessPriority, number> = {
  CRITICAL: 4,
  HIGH: 2,
  NORMAL: 1,
  LOW: 0.5,
  IDLE: 0.25,
} as const;

export const ALL_PRIORITIES: readonly ProcessPriority[] = [
  'CRITICAL',
  'HIGH',
  'NORMAL',
  'LOW',
  'IDLE',
] as const;

export class PriorityHelper {
  public static getWeight(priority: ProcessPriority): number {
    return PRIORITY_WEIGHTS[priority] ?? 3;
  }

  public static getSliceMultiplier(priority: ProcessPriority): number {
    return PRIORITY_SLICE_MULTIPLIERS[priority] ?? 1;
  }

  public static compare(a: ProcessPriority, b: ProcessPriority): number {
    return this.getWeight(b) - this.getWeight(a);
  }

  public static getHigherPriority(priority: ProcessPriority): ProcessPriority {
    switch (priority) {
      case 'IDLE':
        return 'LOW';
      case 'LOW':
        return 'NORMAL';
      case 'NORMAL':
        return 'HIGH';
      case 'HIGH':
      case 'CRITICAL':
        return 'CRITICAL';
    }
  }
}
