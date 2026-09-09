/**
 * @file applications/spreadsheet/components/SpreadsheetChartModal.tsx
 * @description Modal for configuring and viewing local SVG charts built from spreadsheet grid data.
 */

import React, { useState } from 'react';
import { useSpreadsheetStore } from '../store/spreadsheetStore.js';
import { ChartEngine } from '../engine/ChartEngine.js';
import { CellModel } from '../engine/CellModel.js';
import type { SpreadsheetChart } from '../types.js';

export const SpreadsheetChartModal: React.FC = () => {
  const isChartModalOpen = useSpreadsheetStore((s) => s.isChartModalOpen);
  const toggleChartModal = useSpreadsheetStore((s) => s.toggleChartModal);
  const workbook = useSpreadsheetStore((s) => s.workbook);
  const selectionRange = useSpreadsheetStore((s) => s.selectionRange);
  const addChart = useSpreadsheetStore((s) => s.addChart);
  const deleteChart = useSpreadsheetStore((s) => s.deleteChart);

  const activeSheet = workbook.sheets.find((sh) => sh.id === workbook.activeSheetId) || workbook.sheets[0];

  const defaultRangeLabel = selectionRange
    ? `${CellModel.indicesToRef(selectionRange.startRow, selectionRange.startCol)}:${CellModel.indicesToRef(selectionRange.endRow, selectionRange.endCol)}`
    : 'A1:B5';

  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie' | 'area'>('bar');
  const [chartTitle, setChartTitle] = useState('Data Analytics Chart');
  const [dataRange, setDataRange] = useState(defaultRangeLabel);

  if (!isChartModalOpen) return null;

  const previewConfig: SpreadsheetChart = {
    id: 'preview-chart',
    type: chartType,
    title: chartTitle,
    dataRange: dataRange,
  };

  const svgContent = activeSheet ? ChartEngine.renderChartSvg(previewConfig, activeSheet) : '';

  const handleCreateChart = () => {
    addChart({
      type: chartType,
      title: chartTitle,
      dataRange,
    });
    toggleChartModal(false);
  };

  return (
    <div className="wb-spreadsheet-modal-overlay" onClick={() => toggleChartModal(false)}>
      <div className="wb-spreadsheet-modal" onClick={(e) => e.stopPropagation()}>
        <div className="wb-sp-modal-header">
          <h3>📊 Spreadsheet Chart Engine</h3>
          <button className="wb-sp-modal-close" onClick={() => toggleChartModal(false)}>
            ×
          </button>
        </div>

        <div className="wb-sp-modal-body">
          <div className="wb-sp-chart-controls">
            <div className="wb-sp-form-group">
              <label>Chart Title</label>
              <input
                type="text"
                value={chartTitle}
                onChange={(e) => setChartTitle(e.target.value)}
              />
            </div>

            <div className="wb-sp-form-group">
              <label>Chart Type</label>
              <select
                value={chartType}
                onChange={(e) => setChartType(e.target.value as any)}
              >
                <option value="bar">Bar Chart</option>
                <option value="line">Line Chart</option>
                <option value="pie">Pie Chart</option>
                <option value="area">Area Chart</option>
              </select>
            </div>

            <div className="wb-sp-form-group">
              <label>Data Range (e.g. A1:B5)</label>
              <input
                type="text"
                value={dataRange}
                onChange={(e) => setDataRange(e.target.value)}
              />
            </div>
          </div>

          <div className="wb-sp-chart-preview-box">
            <h4>Chart Preview</h4>
            <div
              className="wb-sp-svg-render-container"
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
          </div>
        </div>

        <div className="wb-sp-modal-footer">
          <button className="wb-sp-btn-sec" onClick={() => toggleChartModal(false)}>
            Cancel
          </button>
          <button className="wb-sp-btn-pri" onClick={handleCreateChart}>
            Embed Chart in Sheet
          </button>
        </div>

        {workbook.charts.length > 0 && (
          <div className="wb-sp-existing-charts">
            <h4>Existing Workbook Charts</h4>
            <div className="wb-sp-chart-list">
              {workbook.charts.map((c) => (
                <div key={c.id} className="wb-sp-chart-item">
                  <span>{c.title} ({c.type.toUpperCase()})</span>
                  <button
                    className="wb-sp-btn-del"
                    onClick={() => deleteChart(c.id)}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
