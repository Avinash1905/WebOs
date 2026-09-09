import { describe, it, expect } from 'vitest';
import {
  ResourceBudgetManager,
  ResourceTrendAnalyzer,
  ResourceReclaimer
} from '../../core/resources/index.js';

describe('Resource Management Expansions', () => {
  describe('ResourceBudgetManager', () => {
    it('should track allocations and enforce memory and descriptor limits', () => {
      const budget = new ResourceBudgetManager({ maxMemoryBytes: 1024 * 1024, maxOpenFileDescriptors: 5 });

      expect(budget.requestMemory(512 * 1024)).toBe(true);
      expect(budget.requestMemory(600 * 1024)).toBe(false); // exceeds 1MB

      budget.releaseMemory(512 * 1024);
      expect(budget.requestMemory(600 * 1024)).toBe(true);
    });
  });

  describe('ResourceTrendAnalyzer', () => {
    it('should calculate consumption slope and forecast future values', () => {
      const analyzer = new ResourceTrendAnalyzer(10);
      analyzer.recordSample(100);
      analyzer.recordSample(120);
      analyzer.recordSample(140);
      analyzer.recordSample(160);

      const slope = analyzer.calculateSlope();
      expect(slope).toBeGreaterThan(15);

      const predicted = analyzer.predictNext(2);
      expect(predicted).toBeGreaterThan(180);
    });
  });

  describe('ResourceReclaimer', () => {
    it('should execute tiered reclamation callbacks until target bytes freed', async () => {
      const reclaimer = new ResourceReclaimer();
      reclaimer.registerTier1(() => 200); // Tier 1 frees 200
      reclaimer.registerTier2(() => 500); // Tier 2 frees 500

      const res = await reclaimer.reclaim(600);
      expect(res.bytesFreed).toBe(700);
      expect(res.tierReached).toBe(2);
    });
  });
});
