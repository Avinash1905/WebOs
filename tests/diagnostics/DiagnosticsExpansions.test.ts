import { describe, it, expect } from 'vitest';
import {
  DiagnosticRuleEngine,
  RootCauseAnalyzer,
  SelfHealingAdvisor
} from '../../core/diagnostics/index.js';

describe('Diagnostics Subsystem Expansions', () => {
  describe('DiagnosticRuleEngine', () => {
    it('should evaluate telemetry context and produce diagnostic alerts', () => {
      const ruleEngine = new DiagnosticRuleEngine();
      const alerts = ruleEngine.evaluate({
        memoryUsagePercent: 95,
        runningProcessesCount: 20,
        droppedEventsCount: 5,
        storageUsagePercent: 80
      });

      expect(alerts.some(a => a.ruleId === 'HIGH_MEMORY_PRESSURE')).toBe(true);
      expect(alerts.some(a => a.ruleId === 'EVENT_BUS_DROPS')).toBe(true);
    });
  });

  describe('RootCauseAnalyzer', () => {
    it('should isolate the primary culprit component from crash logs', () => {
      const logs = [
        { timestamp: 1, component: 'storage', error: 'IO Timeout' },
        { timestamp: 2, component: 'storage', error: 'Disk Locked' },
        { timestamp: 3, component: 'network', error: 'Connection Refused' }
      ];

      const analysis = RootCauseAnalyzer.analyze(logs);
      expect(analysis.primaryCulprit).toBe('storage');
      expect(analysis.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('SelfHealingAdvisor', () => {
    it('should generate concrete remediation plans from diagnostic alerts', () => {
      const plans = SelfHealingAdvisor.generatePlan([
        { ruleId: 'HIGH_MEMORY_PRESSURE', severity: 'CRITICAL', message: 'Low memory', suggestedAction: 'Flush' },
        { ruleId: 'STORAGE_PRESSURE', severity: 'WARNING', message: 'Disk near full', suggestedAction: 'Clean' }
      ]);

      expect(plans.some(p => p.actionType === 'FLUSH_CACHE')).toBe(true);
      expect(plans.some(p => p.actionType === 'EMPTY_TRASH')).toBe(true);
    });
  });
});
