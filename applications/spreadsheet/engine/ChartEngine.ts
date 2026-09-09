/**
 * @file applications/spreadsheet/engine/ChartEngine.ts
 * @description In-memory SVG chart generator for Bar, Line, Pie, and Area charts from cell data.
 */

import { CellModel } from './CellModel.js';
import type { CellMap, SpreadsheetChart } from '../types.js';

export interface ChartDataPoint {
  label: string;
  value: number;
}

export class ChartEngine {
  /**
   * Extracts chart data points from range string (e.g. "A1:B5").
   */
  public static extractChartData(cellsOrSheet: CellMap | { cells: CellMap }, rangeStr: string): ChartDataPoint[] {
    const cellMap: CellMap = ('cells' in cellsOrSheet ? cellsOrSheet.cells : cellsOrSheet) as CellMap;
    const range = CellModel.parseRange(rangeStr);
    if (!range) return [];

    const points: ChartDataPoint[] = [];

    for (let r = range.startRow; r <= range.endRow; r++) {
      const labelCoord = CellModel.toCoordinate(r, range.startCol);
      const valCoord = CellModel.toCoordinate(r, range.endCol > range.startCol ? range.endCol : range.startCol);

      const labelCell = cellMap[labelCoord];
      const valCell = cellMap[valCoord];

      const label = labelCell ? String(labelCell.computed !== undefined ? labelCell.computed : labelCell.raw) : `Row ${r + 1}`;
      const rawVal = valCell ? (valCell.computed !== undefined ? valCell.computed : valCell.raw) : 0;
      const value = isNaN(Number(rawVal)) ? 0 : Number(rawVal);

      points.push({ label, value });
    }

    return points;
  }

  /**
   * Renders SVG markup string for chart.
   */
  public static renderChartSvg(chart: SpreadsheetChart, cellsOrSheet: CellMap | { cells: CellMap }): string {
    const data = this.extractChartData(cellsOrSheet, chart.dataRange);
    if (data.length === 0) return '<svg width="400" height="250"><text x="20" y="30">No chart data</text></svg>';

    const width = 440;
    const height = 260;
    const padding = 40;

    const maxVal = Math.max(...data.map((d) => d.value), 1);
    const colors = ['#38bdf8', '#34d399', '#f472b6', '#fbbf24', '#a78bfa', '#f87171'];

    if (chart.type === 'pie') {
      const total = data.reduce((sum, d) => sum + Math.max(0, d.value), 0) || 1;
      let cumulativeAngle = 0;

      const slices = data.map((d, i) => {
        const sliceAngle = (Math.max(0, d.value) / total) * 2 * Math.PI;
        const x1 = 150 + 90 * Math.cos(cumulativeAngle);
        const y1 = 130 + 90 * Math.sin(cumulativeAngle);
        cumulativeAngle += sliceAngle;
        const x2 = 150 + 90 * Math.cos(cumulativeAngle);
        const y2 = 130 + 90 * Math.sin(cumulativeAngle);

        const largeArc = sliceAngle > Math.PI ? 1 : 0;
        const pathData = `M 150 130 L ${x1} ${y1} A 90 90 0 ${largeArc} 1 ${x2} ${y2} Z`;
        const color = colors[i % colors.length];

        return `<path d="${pathData}" fill="${color}" stroke="#1e293b" stroke-width="2"/>`;
      });

      return `
        <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="#0f172a" rx="8"/>
          <text x="20" y="25" fill="#f8fafc" font-size="14" font-weight="bold">${chart.title}</text>
          <g>${slices.join('')}</g>
        </svg>
      `;
    }

    // Default Bar Chart SVG
    const barWidth = Math.floor((width - padding * 2) / data.length) - 8;
    const bars = data.map((d, i) => {
      const barHeight = Math.floor((d.value / maxVal) * (height - padding * 2));
      const x = padding + i * (barWidth + 8);
      const y = height - padding - barHeight;
      const color = colors[i % colors.length];

      return `
        <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${color}" rx="4"/>
        <text x="${x + barWidth / 2}" y="${height - 12}" fill="#94a3b8" font-size="11" text-anchor="middle">${d.label.slice(0, 6)}</text>
        <text x="${x + barWidth / 2}" y="${y - 6}" fill="#f8fafc" font-size="10" text-anchor="middle">${d.value}</text>
      `;
    });

    return `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#0f172a" rx="8"/>
        <text x="20" y="25" fill="#f8fafc" font-size="14" font-weight="bold">${chart.title}</text>
        <line x1="${padding}" y1="${height - padding}" x2="${width - 20}" y2="${height - padding}" stroke="#334155" stroke-width="2"/>
        <g>${bars.join('')}</g>
      </svg>
    `;
  }
}
