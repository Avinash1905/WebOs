import React from 'react';
import { useCalculatorStore } from '../store/calculatorStore.js';

export const CalculatorKeypad: React.FC = () => {
  const {
    mode,
    appendInput,
    clearAll,
    backspace,
    evaluateExpression,
    memoryClear,
    memoryRecall,
    memoryAdd,
    memorySubtract,
    memoryStore,
  } = useCalculatorStore();

  const handleKeyClick = (key: string) => {
    switch (key) {
      case 'C':
        clearAll();
        break;
      case '⌫':
        backspace();
        break;
      case '=':
        evaluateExpression();
        break;
      default:
        appendInput(key);
        break;
    }
  };

  return (
    <div className="calculator-keypad">
      {/* Memory Row */}
      <div className="memory-row">
        <button className="mem-btn" onClick={memoryClear}>MC</button>
        <button className="mem-btn" onClick={memoryRecall}>MR</button>
        <button className="mem-btn" onClick={memoryAdd}>M+</button>
        <button className="mem-btn" onClick={memorySubtract}>M-</button>
        <button className="mem-btn" onClick={memoryStore}>MS</button>
      </div>

      {/* Scientific Row (if scientific mode) */}
      {mode === 'scientific' && (
        <div className="scientific-grid">
          <button className="sci-btn" onClick={() => appendInput('sin(')}>sin</button>
          <button className="sci-btn" onClick={() => appendInput('cos(')}>cos</button>
          <button className="sci-btn" onClick={() => appendInput('tan(')}>tan</button>
          <button className="sci-btn" onClick={() => appendInput('log(')}>log</button>
          <button className="sci-btn" onClick={() => appendInput('ln(')}>ln</button>

          <button className="sci-btn" onClick={() => appendInput('asin(')}>asin</button>
          <button className="sci-btn" onClick={() => appendInput('acos(')}>acos</button>
          <button className="sci-btn" onClick={() => appendInput('atan(')}>atan</button>
          <button className="sci-btn" onClick={() => appendInput('sqrt(')}>√</button>
          <button className="sci-btn" onClick={() => appendInput('cbrt(')}>∛</button>

          <button className="sci-btn" onClick={() => appendInput('sinh(')}>sinh</button>
          <button className="sci-btn" onClick={() => appendInput('cosh(')}>cosh</button>
          <button className="sci-btn" onClick={() => appendInput('tanh(')}>tanh</button>
          <button className="sci-btn" onClick={() => appendInput('abs(')}>abs</button>
          <button className="sci-btn" onClick={() => appendInput('factorial(')}>n!</button>

          <button className="sci-btn" onClick={() => appendInput('PI')}>π</button>
          <button className="sci-btn" onClick={() => appendInput('E')}>e</button>
          <button className="sci-btn" onClick={() => appendInput('^')}>^</button>
          <button className="sci-btn" onClick={() => appendInput('(')}>(</button>
          <button className="sci-btn" onClick={() => appendInput(')')}>)</button>
        </div>
      )}

      {/* Standard Grid */}
      <div className="standard-grid">
        <button className="calc-btn btn-clear" onClick={() => handleKeyClick('C')}>C</button>
        <button className="calc-btn btn-op" onClick={() => handleKeyClick('(')}>(</button>
        <button className="calc-btn btn-op" onClick={() => handleKeyClick(')')}>)</button>
        <button className="calc-btn btn-op" onClick={() => handleKeyClick('/')}>÷</button>

        <button className="calc-btn" onClick={() => handleKeyClick('7')}>7</button>
        <button className="calc-btn" onClick={() => handleKeyClick('8')}>8</button>
        <button className="calc-btn" onClick={() => handleKeyClick('9')}>9</button>
        <button className="calc-btn btn-op" onClick={() => handleKeyClick('*')}>×</button>

        <button className="calc-btn" onClick={() => handleKeyClick('4')}>4</button>
        <button className="calc-btn" onClick={() => handleKeyClick('5')}>5</button>
        <button className="calc-btn" onClick={() => handleKeyClick('6')}>6</button>
        <button className="calc-btn btn-op" onClick={() => handleKeyClick('-')}>-</button>

        <button className="calc-btn" onClick={() => handleKeyClick('1')}>1</button>
        <button className="calc-btn" onClick={() => handleKeyClick('2')}>2</button>
        <button className="calc-btn" onClick={() => handleKeyClick('3')}>3</button>
        <button className="calc-btn btn-op" onClick={() => handleKeyClick('+')}>+</button>

        <button className="calc-btn" onClick={() => handleKeyClick('0')}>0</button>
        <button className="calc-btn" onClick={() => handleKeyClick('.')}>.</button>
        <button className="calc-btn btn-op" onClick={() => handleKeyClick('⌫')}>⌫</button>
        <button className="calc-btn btn-equals" onClick={() => handleKeyClick('=')}>=</button>
      </div>
    </div>
  );
};
