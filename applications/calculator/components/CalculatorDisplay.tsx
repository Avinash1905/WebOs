import React from 'react';
import { History, Sliders } from 'lucide-react';
import { useCalculatorStore } from '../store/calculatorStore.js';

export const CalculatorDisplay: React.FC = () => {
  const {
    mode,
    setMode,
    expression,
    displayValue,
    angleUnit,
    setAngleUnit,
    toggleHistory,
    memory,
  } = useCalculatorStore();

  return (
    <div className="calculator-display-container">
      <div className="calculator-header-bar">
        <div className="mode-tabs">
          <button
            className={`mode-btn ${mode === 'standard' ? 'active' : ''}`}
            onClick={() => setMode('standard')}
          >
            Standard
          </button>
          <button
            className={`mode-btn ${mode === 'scientific' ? 'active' : ''}`}
            onClick={() => setMode('scientific')}
          >
            Scientific
          </button>
          <button
            className={`mode-btn ${mode === 'converter' ? 'active' : ''}`}
            onClick={() => setMode('converter')}
          >
            Converter
          </button>
        </div>

        <div className="header-actions">
          {mode === 'scientific' && (
            <button
              className="angle-unit-btn"
              onClick={() => setAngleUnit(angleUnit === 'deg' ? 'rad' : 'deg')}
            >
              {angleUnit.toUpperCase()}
            </button>
          )}
          <button className="icon-btn" title="Calculation History" onClick={() => toggleHistory()}>
            <History size={16} />
          </button>
        </div>
      </div>

      {mode !== 'converter' && (
        <div className="display-screen">
          <div className="expression-preview">{expression || ' '}</div>
          <div className="display-main-value">
            {displayValue}
            {memory !== 0 && <span className="memory-indicator">M</span>}
          </div>
        </div>
      )}
    </div>
  );
};
