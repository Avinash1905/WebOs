/**
 * @file applications/spreadsheet/SpreadsheetApp.tsx
 * @description Main entry point for the WebOS Spreadsheet application.
 */

import React from 'react';
import { SpreadsheetToolbar } from './components/SpreadsheetToolbar.js';
import { SpreadsheetFormulaBar } from './components/SpreadsheetFormulaBar.js';
import { SpreadsheetGrid } from './components/SpreadsheetGrid.js';
import { SpreadsheetSheetBar } from './components/SpreadsheetSheetBar.js';
import { SpreadsheetChartModal } from './components/SpreadsheetChartModal.js';
import { SpreadsheetFilterModal } from './components/SpreadsheetFilterModal.js';
import './spreadsheet.css';

export interface SpreadsheetAppProps {
  windowId?: string;
  filePath?: string;
}

export const SpreadsheetApp: React.FC<SpreadsheetAppProps> = ({ windowId, filePath }) => {
  return (
    <div className="wb-spreadsheet-app" data-window-id={windowId}>
      <SpreadsheetToolbar />
      <SpreadsheetFormulaBar />
      <SpreadsheetGrid />
      <SpreadsheetSheetBar />
      <SpreadsheetChartModal />
      <SpreadsheetFilterModal />
    </div>
  );
};

export default SpreadsheetApp;
