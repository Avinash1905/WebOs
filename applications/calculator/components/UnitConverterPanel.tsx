import React from 'react';
import { useCalculatorStore } from '../store/calculatorStore.js';
import { UNIT_CATEGORIES } from '../engine/UnitConverter.js';

export const UnitConverterPanel: React.FC = () => {
  const {
    selectedCategory,
    setConverterCategory,
    fromUnit,
    setFromUnit,
    toUnit,
    setToUnit,
    converterInput,
    setConverterInput,
    converterResult,
  } = useCalculatorStore();

  const currentCategoryObj =
    UNIT_CATEGORIES.find((c) => c.id === selectedCategory) || UNIT_CATEGORIES[0]!;

  return (
    <div className="unit-converter-panel">
      <div className="converter-row">
        <label className="field-label">Category</label>
        <select
          className="select-field"
          value={selectedCategory}
          onChange={(e) => setConverterCategory(e.target.value)}
        >
          {UNIT_CATEGORIES.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div className="converter-card">
        <div className="converter-section">
          <label className="field-label">From</label>
          <input
            type="number"
            className="converter-input-val"
            value={converterInput}
            onChange={(e) => setConverterInput(e.target.value)}
          />
          <select
            className="select-field"
            value={fromUnit}
            onChange={(e) => setFromUnit(e.target.value)}
          >
            {currentCategoryObj.units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>

        <div className="converter-divider">=</div>

        <div className="converter-section">
          <label className="field-label">To</label>
          <div className="converter-result-val">{converterResult}</div>
          <select
            className="select-field"
            value={toUnit}
            onChange={(e) => setToUnit(e.target.value)}
          >
            {currentCategoryObj.units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
