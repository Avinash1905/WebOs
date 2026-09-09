import React, { useState } from 'react';
import { Delete, RotateCcw } from 'lucide-react';
import './calculator.css';

export const CalculatorApp: React.FC<{ windowId: string; appId: string }> = () => {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [memory, setMemory] = useState<number>(0);
  const [isScientific, setIsScientific] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  const handleDigit = (digit: string) => {
    setDisplay((prev) => (prev === '0' || prev === 'Error' ? digit : prev + digit));
  };

  const handleDecimal = () => {
    if (!display.includes('.')) {
      setDisplay((prev) => prev + '.');
    }
  };

  const handleOperator = (op: string) => {
    setEquation(`${display} ${op} `);
    setDisplay('0');
  };

  const handleClear = () => {
    setDisplay('0');
    setEquation('');
  };

  const handleDelete = () => {
    setDisplay((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
  };

  const handleEquals = () => {
    if (!equation) return;
    try {
      const fullExpression = equation + display;
      // Sanitize safe math tokens
      const sanitized = fullExpression.replace(/[^0-9+\-*/().]/g, '');
      const result = new Function(`return ${sanitized}`)();
      const resultStr = String(Number(result.toFixed(8)));

      setHistory((prev) => [`${fullExpression} = ${resultStr}`, ...prev].slice(0, 10));
      setDisplay(resultStr);
      setEquation('');
    } catch {
      setDisplay('Error');
      setEquation('');
    }
  };

  const handleScientificFunc = (func: string) => {
    try {
      const num = parseFloat(display);
      let res = 0;
      switch (func) {
        case 'sin': res = Math.sin(num); break;
        case 'cos': res = Math.cos(num); break;
        case 'tan': res = Math.tan(num); break;
        case 'sqrt': res = Math.sqrt(num); break;
        case 'sqr': res = Math.pow(num, 2); break;
        case 'log': res = Math.log10(num); break;
        case 'ln': res = Math.log(num); break;
      }
      setDisplay(String(Number(res.toFixed(8))));
    } catch {
      setDisplay('Error');
    }
  };

  return (
    <div className="calculator-container">
      {/* Top Header Mode Toggle */}
      <div className="calc-header">
        <span className="calc-title">{isScientific ? 'Scientific Calculator' : 'Standard Calculator'}</span>
        <button
          className="mode-toggle-btn"
          onClick={() => setIsScientific(!isScientific)}
        >
          {isScientific ? 'Standard' : 'Scientific'}
        </button>
      </div>

      {/* Main Display Screen */}
      <div className="calc-screen">
        <div className="calc-equation">{equation}</div>
        <div className="calc-display">{display}</div>
      </div>

      {/* Memory Bar */}
      <div className="calc-memory-bar">
        <button onClick={() => setMemory(0)} disabled={memory === 0}>MC</button>
        <button onClick={() => setDisplay(String(memory))} disabled={memory === 0}>MR</button>
        <button onClick={() => setMemory((m) => m + parseFloat(display))}>M+</button>
        <button onClick={() => setMemory((m) => m - parseFloat(display))}>M-</button>
        <button onClick={() => setMemory(parseFloat(display))}>MS</button>
      </div>

      {/* Keypad Grid */}
      <div className={`calc-keypad ${isScientific ? 'scientific' : ''}`}>
        {isScientific && (
          <>
            <button className="sci-btn" onClick={() => handleScientificFunc('sin')}>sin</button>
            <button className="sci-btn" onClick={() => handleScientificFunc('cos')}>cos</button>
            <button className="sci-btn" onClick={() => handleScientificFunc('tan')}>tan</button>
            <button className="sci-btn" onClick={() => handleScientificFunc('sqrt')}>√</button>
            <button className="sci-btn" onClick={() => handleScientificFunc('sqr')}>x²</button>
            <button className="sci-btn" onClick={() => handleScientificFunc('log')}>log</button>
            <button className="sci-btn" onClick={() => handleScientificFunc('ln')}>ln</button>
            <button className="sci-btn" onClick={() => setDisplay(String(Math.PI))}>π</button>
          </>
        )}

        <button className="action-btn" onClick={handleClear}><RotateCcw size={14} /> C</button>
        <button className="action-btn" onClick={handleDelete}><Delete size={14} /></button>
        <button className="op-btn" onClick={() => handleOperator('/')}>÷</button>
        <button className="op-btn" onClick={() => handleOperator('*')}>×</button>

        <button className="num-btn" onClick={() => handleDigit('7')}>7</button>
        <button className="num-btn" onClick={() => handleDigit('8')}>8</button>
        <button className="num-btn" onClick={() => handleDigit('9')}>9</button>
        <button className="op-btn" onClick={() => handleOperator('-')}>−</button>

        <button className="num-btn" onClick={() => handleDigit('4')}>4</button>
        <button className="num-btn" onClick={() => handleDigit('5')}>5</button>
        <button className="num-btn" onClick={() => handleDigit('6')}>6</button>
        <button className="op-btn" onClick={() => handleOperator('+')}>+</button>

        <button className="num-btn" onClick={() => handleDigit('1')}>1</button>
        <button className="num-btn" onClick={() => handleDigit('2')}>2</button>
        <button className="num-btn" onClick={() => handleDigit('3')}>3</button>
        <button className="equals-btn" onClick={handleEquals}>=</button>

        <button className="num-btn zero-btn" onClick={() => handleDigit('0')}>0</button>
        <button className="num-btn" onClick={handleDecimal}>.</button>
      </div>

      {/* History Drawer */}
      {history.length > 0 && (
        <div className="calc-history">
          <div className="history-label">Recent Calculations</div>
          {history.map((h, i) => (
            <div key={i} className="history-item">{h}</div>
          ))}
        </div>
      )}
    </div>
  );
};
