/**
 * @file applications/calculator/types.ts
 * @description Types and data structures for WebOS Calculator application.
 */

export type AngleUnit = 'deg' | 'rad';

export type CalculatorMode = 'standard' | 'scientific' | 'converter';

export interface CalculationHistoryItem {
  id: string;
  expression: string;
  result: string;
  timestamp: number;
}

export interface UnitCategory {
  id: string;
  name: string;
  units: { id: string; name: string; toBase: (val: number) => number; fromBase: (val: number) => number }[];
}

export interface CalculatorState {
  mode: CalculatorMode;
  expression: string;
  displayValue: string;
  memory: number;
  history: CalculationHistoryItem[];
  angleUnit: AngleUnit;
  isHistoryOpen: boolean;
  selectedCategory: string;
  fromUnit: string;
  toUnit: string;
  converterInput: string;
  converterResult: string;
}

export interface CalculatorActions {
  setMode: (mode: CalculatorMode) => void;
  appendInput: (char: string) => void;
  clearAll: () => void;
  clearEntry: () => void;
  backspace: () => void;
  evaluateExpression: () => void;
  setAngleUnit: (unit: AngleUnit) => void;
  memoryClear: () => void;
  memoryRecall: () => void;
  memoryAdd: () => void;
  memorySubtract: () => void;
  memoryStore: () => void;
  toggleHistory: (open?: boolean) => void;
  clearHistory: () => void;
  deleteHistoryItem: (id: string) => void;
  reuseHistoryItem: (item: CalculationHistoryItem, target: 'expression' | 'result') => void;
  setConverterCategory: (category: string) => void;
  setFromUnit: (unit: string) => void;
  setToUnit: (unit: string) => void;
  setConverterInput: (val: string) => void;
}
