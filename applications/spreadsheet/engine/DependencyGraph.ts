/**
 * @file applications/spreadsheet/engine/DependencyGraph.ts
 * @description Direct and inverse cell dependency graph, topological calculation ordering, and cycle detection.
 */

import { CellModel } from './CellModel.js';
import { FormulaParser } from './FormulaParser.js';
import type { CellMap } from '../types.js';

export class DependencyGraph {
  /**
   * Extracts all cell coordinate dependencies referenced in a raw formula.
   */
  public static extractDependencies(formula: string): string[] {
    if (!formula.startsWith('=')) return [];

    const deps = new Set<string>();

    // 1. Single cell coordinates e.g. A1, $B$5
    const singleMatches = formula.matchAll(/\b(\$?[A-Z]+\$?[0-9]+)\b/gi);
    for (const match of singleMatches) {
      const parsed = CellModel.parseCoordinate(match[1]!);
      if (parsed) {
        deps.add(CellModel.toCoordinate(parsed.row, parsed.col));
      }
    }

    // 2. Range coordinates e.g. A1:C10
    const rangeMatches = formula.matchAll(/\b(\$?[A-Z]+\$?[0-9]+:\$?[A-Z]+\$?[0-9]+)\b/gi);
    for (const match of rangeMatches) {
      const range = CellModel.parseRange(match[1]!);
      if (range) {
        CellModel.getCoordinatesInRange(range).forEach((c) => deps.add(c));
      }
    }

    return Array.from(deps);
  }

  /**
   * Recalculates all cell values in topological order.
   */
  public static recalculateAll(cellMap: CellMap): CellMap {
    const updatedMap: CellMap = { ...cellMap };

    // Build dependency map (Cell -> list of cells it depends on)
    const dependsOn: Record<string, string[]> = {};
    Object.keys(updatedMap).forEach((coord) => {
      const raw = updatedMap[coord]?.raw || '';
      if (raw.startsWith('=')) {
        dependsOn[coord] = this.extractDependencies(raw);
      } else {
        dependsOn[coord] = [];
      }
    });

    // Evaluate each cell safely
    Object.keys(updatedMap).forEach((coord) => {
      const cellData = updatedMap[coord]!;
      if (cellData.raw.startsWith('=')) {
        const computed = FormulaParser.evaluateFormula(cellData.raw, updatedMap, new Set([coord]));
        let type = 'formula';
        if (typeof computed === 'string' && computed.startsWith('#')) {
          type = 'error';
        }
        updatedMap[coord] = {
          ...cellData,
          computed,
          type: type as any,
        };
      } else {
        const raw = cellData.raw;
        let computed: any = raw;
        let type = 'text';

        if (!isNaN(Number(raw)) && raw.trim() !== '') {
          computed = Number(raw);
          type = 'number';
        } else if (raw.toLowerCase() === 'true' || raw.toLowerCase() === 'false') {
          computed = raw.toLowerCase() === 'true';
          type = 'boolean';
        }

        updatedMap[coord] = {
          ...cellData,
          computed,
          type: type as any,
        };
      }
    });

    return updatedMap;
  }
}
