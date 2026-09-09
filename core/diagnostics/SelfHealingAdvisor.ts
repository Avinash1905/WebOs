/**
 * @file SelfHealingAdvisor.ts
 * @description Prescriptive self-healing action engine recommending recovery procedures.
 */

import type { DiagnosticAlert } from './DiagnosticRuleEngine.js';

export interface HealingPlan {
  readonly alertRuleId: string;
  readonly actionType: 'RESTART_SERVICE' | 'FLUSH_CACHE' | 'EMPTY_TRASH' | 'THROTTLE_EVENTS';
  readonly target: string;
}

export class SelfHealingAdvisor {
  public static generatePlan(alerts: readonly DiagnosticAlert[]): readonly HealingPlan[] {
    const plans: HealingPlan[] = [];

    for (const alert of alerts) {
      switch (alert.ruleId) {
        case 'HIGH_MEMORY_PRESSURE':
          plans.push({ alertRuleId: alert.ruleId, actionType: 'FLUSH_CACHE', target: 'storage' });
          break;
        case 'EVENT_BUS_DROPS':
          plans.push({ alertRuleId: alert.ruleId, actionType: 'THROTTLE_EVENTS', target: 'events' });
          break;
        case 'STORAGE_PRESSURE':
          plans.push({ alertRuleId: alert.ruleId, actionType: 'EMPTY_TRASH', target: 'trash' });
          break;
      }
    }

    return Object.freeze(plans);
  }
}
