/**
 * @file RecoveryAdvisor.ts
 * @description Safe, non-destructive recovery recommendation generator for WebOS.
 */

import type { DiagnosticResult } from './types.js';

export class RecoveryAdvisor {
  public static getRecommendations(results: readonly DiagnosticResult[]): string[] {
    const recommendations = new Set<string>();

    for (const r of results) {
      if (r.status === 'FAIL' || r.status === 'WARNING') {
        if (r.recommendation) {
          recommendations.add(r.recommendation);
        } else {
          switch (r.checkId) {
            case 'storage':
              recommendations.add('Check storage quota and clear unused WebOS application data or caches.');
              break;
            case 'filesystem':
              recommendations.add('Inspect VFS root structure and ensure Storage Engine is initialized.');
              break;
            case 'process':
              recommendations.add('Inspect process hierarchy for deadlocked or orphaned processes.');
              break;
            case 'scheduler':
              recommendations.add('Restart Scheduler service to reset process execution queues.');
              break;
            case 'services':
              recommendations.add('Try restarting any failed or stopped required background services.');
              break;
            case 'resources':
              recommendations.add('Close inactive applications to free browser heap and system processes.');
              break;
            default:
              recommendations.add(`Review ${r.name} configuration and service dependencies.`);
              break;
          }
        }
      }
    }

    return Array.from(recommendations);
  }
}
