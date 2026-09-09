/**
 * @file DocumentTableEditor.tsx
 * @description Table element renderer and row/column editor for structured document model.
 */

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useDocumentEditorStore } from '../store/documentEditorStore.js';
import type { DocTable } from '../types.js';

interface DocumentTableEditorProps {
  table: DocTable;
}

export const DocumentTableEditor: React.FC<DocumentTableEditorProps> = ({ table }) => {
  const {
    selectedBlockId,
    updateTableCellText,
    addTableRow,
    removeTableRow,
    addTableColumn,
    removeTableColumn,
    deleteBlock,
    selectBlock,
  } = useDocumentEditorStore();

  const isSelected = selectedBlockId === table.id;

  return (
    <div
      className={`doc-table-wrap ${isSelected ? 'selected' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        selectBlock(table.id);
      }}
    >
      {isSelected && (
        <div className="doc-table-toolbar">
          <button className="doc-tb-btn" onClick={() => addTableRow(table.id)} title="Add Row Below">
            <Plus size={12} /> Row
          </button>
          <button className="doc-tb-btn" onClick={() => addTableColumn(table.id)} title="Add Column Right">
            <Plus size={12} /> Column
          </button>
          <button className="doc-tb-btn danger" onClick={() => deleteBlock(table.id)} title="Delete Table">
            <Trash2 size={12} /> Table
          </button>
        </div>
      )}

      <table className="doc-table">
        <tbody>
          {table.rows.map((row, rIdx) => (
            <tr key={row.id}>
              {row.cells.map((cell, cIdx) => (
                <td key={cell.id} className="doc-table-cell">
                  <input
                    type="text"
                    className="doc-table-input"
                    value={cell.runs[0]?.text || ''}
                    onChange={(e) => updateTableCellText(table.id, rIdx, cIdx, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  {isSelected && (
                    <div className="doc-cell-actions">
                      <button
                        className="doc-cell-del-btn"
                        title="Delete Row"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeTableRow(table.id, rIdx);
                        }}
                      >
                        <Trash2 size={10} />
                      </button>
                      <button
                        className="doc-cell-del-btn"
                        title="Delete Column"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeTableColumn(table.id, cIdx);
                        }}
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
