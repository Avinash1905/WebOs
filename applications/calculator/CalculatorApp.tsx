import React from 'react';
import { useCalculatorStore } from './store/calculatorStore.js';
import { CalculatorDisplay } from './components/CalculatorDisplay.js';
import { CalculatorKeypad } from './components/CalculatorKeypad.js';
import { UnitConverterPanel } from './components/UnitConverterPanel.js';
import { CalculatorHistoryPanel } from './components/CalculatorHistoryPanel.js';
import './calculator.css';

interface CalculatorAppProps {
  windowId?: string;
  appId?: string;
}

export const CalculatorApp: React.FC<CalculatorAppProps> = () => {
  const { mode } = useCalculatorStore();

  return (
    <div className="calculator-app-container">
      <CalculatorDisplay />
      {mode === 'converter' ? <UnitConverterPanel /> : <CalculatorKeypad />}
      <CalculatorHistoryPanel />
    </div>
  );
};

export default CalculatorApp;
