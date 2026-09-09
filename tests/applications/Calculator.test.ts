/**
 * @file tests/applications/Calculator.test.ts
 * @description Comprehensive unit tests for WebOS Calculator calculation engine, AST parser, scientific functions, and unit converter.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ExpressionParser } from '../../applications/calculator/engine/ExpressionParser.js';
import { UnitConverter } from '../../applications/calculator/engine/UnitConverter.js';
import { useCalculatorStore } from '../../applications/calculator/store/calculatorStore.js';

describe('Calculator — ExpressionParser AST Engine', () => {
  it('should evaluate standard arithmetic with operator precedence', () => {
    expect(ExpressionParser.calculate('25 + 10 * 3')).toBe(55);
    expect(ExpressionParser.calculate('100 / 4 - 5 * 2')).toBe(15);
    expect(ExpressionParser.calculate('(10 + 20) * 3')).toBe(90);
    expect(ExpressionParser.calculate('2 ^ 3 + 4')).toBe(12);
  });

  it('should evaluate decimal and negative numbers correctly', () => {
    expect(ExpressionParser.calculate('3.5 * 2.0')).toBe(7);
    expect(ExpressionParser.calculate('-5 + 12')).toBe(7);
    expect(ExpressionParser.calculate('(-4) * (-3)')).toBe(12);
  });

  it('should evaluate scientific mathematical functions', () => {
    expect(ExpressionParser.calculate('sin(0)')).toBe(0);
    expect(ExpressionParser.calculate('cos(0)')).toBe(1);
    expect(ExpressionParser.calculate('sqrt(16)')).toBe(4);
    expect(ExpressionParser.calculate('cbrt(27)')).toBe(3);
    expect(ExpressionParser.calculate('abs(-42)')).toBe(42);
    expect(ExpressionParser.calculate('floor(3.9)')).toBe(3);
    expect(ExpressionParser.calculate('ceil(3.1)')).toBe(4);
    expect(ExpressionParser.calculate('round(3.5)')).toBe(4);
    expect(ExpressionParser.calculate('factorial(5)')).toBe(120);
  });

  it('should evaluate mathematical constants PI and E', () => {
    expect(ExpressionParser.calculate('PI')).toBeCloseTo(Math.PI);
    expect(ExpressionParser.calculate('E')).toBeCloseTo(Math.E);
    expect(ExpressionParser.calculate('2 * PI')).toBeCloseTo(2 * Math.PI);
  });

  it('should handle division by zero safely without crashing', () => {
    expect(() => ExpressionParser.calculate('10 / 0')).toThrow(/Division by zero/i);
  });

  it('should throw validation error on invalid syntax', () => {
    expect(() => ExpressionParser.calculate('25 +')).toThrow();
    expect(() => ExpressionParser.calculate('((10 + 5)')).toThrow(/Unexpected end|Mismatched/i);
  });
});

describe('Calculator — UnitConverter Engine', () => {
  it('should convert length units', () => {
    expect(UnitConverter.convert(1, 'length', 'km', 'm')).toBe(1000);
    expect(UnitConverter.convert(1, 'length', 'mi', 'm')).toBeCloseTo(1609.344);
  });

  it('should convert temperature units', () => {
    expect(UnitConverter.convert(0, 'temperature', 'c', 'f')).toBe(32);
    expect(UnitConverter.convert(100, 'temperature', 'c', 'k')).toBe(373.15);
  });

  it('should convert digital storage units', () => {
    expect(UnitConverter.convert(1, 'data', 'gb', 'mb')).toBe(1024);
    expect(UnitConverter.convert(1, 'data', 'tb', 'gb')).toBe(1024);
  });

  it('should list all supported conversion categories', () => {
    const categories = UnitConverter.getCategories();
    expect(categories).toContain('Length');
    expect(categories).toContain('Temperature');
    expect(categories.length).toBeGreaterThanOrEqual(10);
  });
});

describe('Calculator — Zustand Store State Management', () => {
  beforeEach(() => {
    useCalculatorStore.getState().clearAll();
  });

  it('should append input and evaluate expression', () => {
    const store = useCalculatorStore.getState();
    store.appendInput('2');
    store.appendInput('5');
    store.appendInput('+');
    store.appendInput('1');
    store.appendInput('5');
    store.evaluateExpression();

    expect(useCalculatorStore.getState().displayValue).toBe('40');
    expect(useCalculatorStore.getState().history.length).toBe(1);
    expect(useCalculatorStore.getState().history[0].expression).toBe('25+15');
    expect(useCalculatorStore.getState().history[0].result).toBe('40');
  });

  it('should support memory operations (MS, MR, M+, M-, MC)', () => {
    const store = useCalculatorStore.getState();
    store.appendInput('50');
    store.memoryStore();
    expect(useCalculatorStore.getState().memory).toBe(50);

    store.memoryAdd();
    expect(useCalculatorStore.getState().memory).toBe(100);

    store.memorySubtract();
    expect(useCalculatorStore.getState().memory).toBe(50);

    store.memoryClear();
    expect(useCalculatorStore.getState().memory).toBe(0);
  });
});
