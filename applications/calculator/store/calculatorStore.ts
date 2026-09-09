/**
 * @file applications/calculator/store/calculatorStore.ts
 * @description Zustand store for WebOS Calculator application.
 */

import { create } from 'zustand';
import { ExpressionParser } from '../engine/ExpressionParser.js';
import { UnitConverter, UNIT_CATEGORIES } from '../engine/UnitConverter.js';
import type {
  CalculatorState,
  CalculatorActions,
  CalculationHistoryItem,
  AngleUnit,
  CalculatorMode,
} from '../types.js';

const STORAGE_HISTORY_KEY = 'webos_calculator_history';
const STORAGE_PREFS_KEY = 'webos_calculator_prefs';

function loadSavedHistory(): CalculationHistoryItem[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_HISTORY_KEY);
      if (raw) return JSON.parse(raw);
    }
  } catch {}
  return [];
}

const initialCategory = UNIT_CATEGORIES[0]!;

export const useCalculatorStore = create<CalculatorState & CalculatorActions>((set, get) => ({
  mode: 'standard',
  expression: '',
  displayValue: '0',
  memory: 0,
  history: loadSavedHistory(),
  angleUnit: 'deg',
  isHistoryOpen: false,
  selectedCategory: initialCategory.id,
  fromUnit: initialCategory.units[0]!.id,
  toUnit: initialCategory.units[1]!.id,
  converterInput: '1',
  converterResult: String(
    UnitConverter.convert(
      1,
      initialCategory.id,
      initialCategory.units[0]!.id,
      initialCategory.units[1]!.id
    )
  ),

  setMode: (mode: CalculatorMode) => set({ mode }),

  appendInput: (char: string) => {
    const { expression, displayValue } = get();
    if (displayValue === 'Error') {
      set({ expression: char, displayValue: char });
      return;
    }

    const newExpr = expression + char;
    set({ expression: newExpr, displayValue: newExpr });
  },

  clearAll: () => {
    set({ expression: '', displayValue: '0' });
  },

  clearEntry: () => {
    set({ expression: '', displayValue: '0' });
  },

  backspace: () => {
    const { expression } = get();
    if (expression.length <= 1) {
      set({ expression: '', displayValue: '0' });
    } else {
      const sliced = expression.slice(0, -1);
      set({ expression: sliced, displayValue: sliced });
    }
  },

  evaluateExpression: () => {
    const { expression, angleUnit, history } = get();
    if (!expression.trim()) return;

    try {
      const resultNum = ExpressionParser.calculate(expression, angleUnit);
      const resultStr = String(Number(resultNum.toFixed(10)));

      const newItem: CalculationHistoryItem = {
        id: `calc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        expression,
        result: resultStr,
        timestamp: Date.now(),
      };

      const updatedHistory = [newItem, ...history].slice(0, 100);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(updatedHistory));
      }

      set({
        displayValue: resultStr,
        expression: resultStr,
        history: updatedHistory,
      });
    } catch (err: any) {
      set({ displayValue: 'Error' });
    }
  },

  setAngleUnit: (unit: AngleUnit) => set({ angleUnit: unit }),

  memoryClear: () => set({ memory: 0 }),
  memoryRecall: () => {
    const { memory } = get();
    set({ expression: String(memory), displayValue: String(memory) });
  },
  memoryAdd: () => {
    const { displayValue, memory } = get();
    const val = parseFloat(displayValue) || 0;
    set({ memory: memory + val });
  },
  memorySubtract: () => {
    const { displayValue, memory } = get();
    const val = parseFloat(displayValue) || 0;
    set({ memory: memory - val });
  },
  memoryStore: () => {
    const { displayValue } = get();
    const val = parseFloat(displayValue) || 0;
    set({ memory: val });
  },

  toggleHistory: (open) => {
    const nextState = open !== undefined ? open : !get().isHistoryOpen;
    set({ isHistoryOpen: nextState });
  },

  clearHistory: () => {
    set({ history: [] });
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_HISTORY_KEY);
    }
  },

  deleteHistoryItem: (id: string) => {
    const updated = get().history.filter((h) => h.id !== id);
    set({ history: updated });
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(updated));
    }
  },

  reuseHistoryItem: (item, target) => {
    const val = target === 'expression' ? item.expression : item.result;
    set({ expression: val, displayValue: val, isHistoryOpen: false });
  },

  setConverterCategory: (categoryId: string) => {
    const cat = UNIT_CATEGORIES.find((c) => c.id === categoryId) || UNIT_CATEGORIES[0]!;
    const fromUnit = cat.units[0]!.id;
    const toUnit = cat.units[1] ? cat.units[1]!.id : cat.units[0]!.id;
    const inputVal = get().converterInput;
    const numVal = parseFloat(inputVal) || 0;

    const res = UnitConverter.convert(numVal, cat.id, fromUnit, toUnit);

    set({
      selectedCategory: cat.id,
      fromUnit,
      toUnit,
      converterResult: String(Number(res.toFixed(6))),
    });
  },

  setFromUnit: (unit: string) => {
    const { selectedCategory, toUnit, converterInput } = get();
    const numVal = parseFloat(converterInput) || 0;
    const res = UnitConverter.convert(numVal, selectedCategory, unit, toUnit);

    set({
      fromUnit: unit,
      converterResult: String(Number(res.toFixed(6))),
    });
  },

  setToUnit: (unit: string) => {
    const { selectedCategory, fromUnit, converterInput } = get();
    const numVal = parseFloat(converterInput) || 0;
    const res = UnitConverter.convert(numVal, selectedCategory, fromUnit, unit);

    set({
      toUnit: unit,
      converterResult: String(Number(res.toFixed(6))),
    });
  },

  setConverterInput: (val: string) => {
    const { selectedCategory, fromUnit, toUnit } = get();
    const numVal = parseFloat(val) || 0;
    const res = UnitConverter.convert(numVal, selectedCategory, fromUnit, toUnit);

    set({
      converterInput: val,
      converterResult: String(Number(res.toFixed(6))),
    });
  },
}));
