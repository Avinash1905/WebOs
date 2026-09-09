import React, { useState } from 'react';
import { Search, X, Trash2 } from 'lucide-react';
import { useCalculatorStore } from '../store/calculatorStore.js';

export const CalculatorHistoryPanel: React.FC = () => {
  const {
    history,
    isHistoryOpen,
    toggleHistory,
    clearHistory,
    deleteHistoryItem,
    reuseHistoryItem,
  } = useCalculatorStore();

  const [searchQuery, setSearchQuery] = useState('');

  if (!isHistoryOpen) return null;

  const filtered = history.filter(
    (h) =>
      h.expression.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.result.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="calculator-modal-overlay" onClick={() => toggleHistory(false)}>
      <div className="calculator-history-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="title">Calculation History</div>
          <div className="actions">
            {history.length > 0 && (
              <button className="icon-btn" title="Clear History" onClick={clearHistory}>
                <Trash2 size={16} />
              </button>
            )}
            <button className="icon-btn" onClick={() => toggleHistory(false)}>
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="search-bar">
          <Search size={14} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search history..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="history-list">
          {filtered.length === 0 ? (
            <div className="empty-history">No history records found.</div>
          ) : (
            filtered.map((item) => (
              <div key={item.id} className="history-item">
                <div className="item-main">
                  <div
                    className="item-expression"
                    onClick={() => reuseHistoryItem(item, 'expression')}
                    title="Click to reuse expression"
                  >
                    {item.expression} =
                  </div>
                  <div
                    className="item-result"
                    onClick={() => reuseHistoryItem(item, 'result')}
                    title="Click to reuse result"
                  >
                    {item.result}
                  </div>
                </div>
                <button
                  className="delete-item-btn"
                  onClick={() => deleteHistoryItem(item.id)}
                >
                  <X size={12} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
