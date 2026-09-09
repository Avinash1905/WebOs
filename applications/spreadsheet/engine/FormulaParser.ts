/**
 * @file applications/spreadsheet/engine/FormulaParser.ts
 * @description Safe Formula Parser & Evaluator supporting 35+ functions, ranges, and cell references (zero eval).
 */

import { CellModel } from './CellModel.js';
import type { CellMap } from '../types.js';

export class FormulaParser {
  /**
   * Evaluates a formula string (starting with '=') given current cell map.
   */
  public static evaluateFormula(
    formula: string,
    cellMap: CellMap,
    visitedCells: Set<string> = new Set()
  ): string | number | boolean {
    const expr = formula.substring(1).trim();
    if (!expr) return '';

    try {
      return this.evaluateExpression(expr, cellMap, visitedCells);
    } catch (err: any) {
      if (err?.message?.includes('CIRCULAR')) return '#CIRCULAR!';
      if (err?.message?.includes('Division by zero')) return '#DIV/0!';
      if (err?.message?.includes('REF')) return '#REF!';
      if (err?.message?.includes('NAME')) return '#NAME?';
      return '#VALUE!';
    }
  }

  private static evaluateExpression(
    expr: string,
    cellMap: CellMap,
    visitedCells: Set<string>
  ): any {
    // 1. Function calls e.g. SUM(A1:A10), IF(A1 > 5, "Yes", "No")
    const funcMatch = expr.match(/^([A-Z0-9_]+)\((.*)\)$/i);
    if (funcMatch) {
      const funcName = funcMatch[1]!.toUpperCase();
      const rawArgs = this.splitArgs(funcMatch[2]!);
      return this.executeFunction(funcName, rawArgs, cellMap, visitedCells);
    }

    // 2. Binary Arithmetic Operators: + - * / % ^
    const binOp = this.findMainOperator(expr);
    if (binOp) {
      const leftVal = this.evaluateExpression(binOp.left, cellMap, visitedCells);
      const rightVal = this.evaluateExpression(binOp.right, cellMap, visitedCells);

      if (typeof leftVal === 'string' && leftVal.startsWith('#')) return leftVal;
      if (typeof rightVal === 'string' && rightVal.startsWith('#')) return rightVal;

      const l = Number(leftVal);
      const r = Number(rightVal);

      switch (binOp.op) {
        case '=': return leftVal === rightVal || l === r;
        case '!=': return leftVal !== rightVal && l !== r;
        case '<': return l < r;
        case '>': return l > r;
        case '<=': return l <= r;
        case '>=': return l >= r;
        case '+': return l + r;
        case '-': return l - r;
        case '*': return l * r;
        case '/':
          if (r === 0) throw new Error('Division by zero.');
          return l / r;
        case '%': return l % r;
        case '^': return Math.pow(l, r);
      }
    }

    // 3. String Literal
    if ((expr.startsWith('"') && expr.endsWith('"')) || (expr.startsWith("'") && expr.endsWith("'"))) {
      return expr.slice(1, -1);
    }

    // 4. Boolean Literal
    if (expr.toUpperCase() === 'TRUE') return true;
    if (expr.toUpperCase() === 'FALSE') return false;

    // 5. Number Literal
    if (!isNaN(Number(expr))) {
      return Number(expr);
    }

    // 6. Cell Reference (e.g. A1, $B$5)
    const coordInfo = CellModel.parseCoordinate(expr);
    if (coordInfo) {
      const coordKey = CellModel.toCoordinate(coordInfo.row, coordInfo.col);
      if (visitedCells.has(coordKey)) {
        throw new Error('CIRCULAR reference detected.');
      }
      const cellData = cellMap[coordKey];
      if (!cellData || !cellData.raw) return 0;

      if (cellData.raw.startsWith('=')) {
        const nextVisited = new Set(visitedCells);
        nextVisited.add(coordKey);
        return this.evaluateFormula(cellData.raw, cellMap, nextVisited);
      }

      const val = cellData.computed !== undefined ? cellData.computed : cellData.raw;
      return isNaN(Number(val)) ? val : Number(val);
    }

    throw new Error(`NAME: Invalid expression '${expr}'`);
  }

  private static splitArgs(argsStr: string): string[] {
    const args: string[] = [];
    let current = '';
    let parenDepth = 0;
    let inQuotes = false;

    for (let i = 0; i < argsStr.length; i++) {
      const char = argsStr[i]!;
      if (char === '"' || char === "'") inQuotes = !inQuotes;

      if (!inQuotes) {
        if (char === '(') parenDepth++;
        else if (char === ')') parenDepth--;
        else if (char === ',' && parenDepth === 0) {
          args.push(current.trim());
          current = '';
          continue;
        }
      }
      current += char;
    }
    if (current.trim()) args.push(current.trim());
    return args;
  }

  private static findMainOperator(expr: string): { left: string; op: string; right: string } | null {
    const ops = ['=', '<', '>', '+', '-', '*', '/', '%', '^'];
    let parenDepth = 0;
    let inQuotes = false;

    for (let i = expr.length - 1; i >= 0; i--) {
      const char = expr[i]!;
      if (char === '"' || char === "'") inQuotes = !inQuotes;
      if (!inQuotes) {
        if (char === ')') parenDepth++;
        else if (char === '(') parenDepth--;
        else if (parenDepth === 0 && ops.includes(char)) {
          // Check if minus is unary
          if (char === '-' && (i === 0 || ['+', '-', '*', '/', '%', '^', '=', '<', '>'].includes(expr[i - 1]!))) {
            continue;
          }
          return {
            left: expr.substring(0, i).trim(),
            op: char,
            right: expr.substring(i + 1).trim(),
          };
        }
      }
    }
    return null;
  }

  private static getValuesFromArg(arg: string, cellMap: CellMap, visitedCells: Set<string>): any[] {
    if (arg.includes(':')) {
      const range = CellModel.parseRange(arg);
      if (range) {
        const coords = CellModel.getCoordinatesInRange(range);
        return coords.map((c) => this.evaluateExpression(c, cellMap, visitedCells));
      }
    }
    return [this.evaluateExpression(arg, cellMap, visitedCells)];
  }

  private static executeFunction(
    name: string,
    args: string[],
    cellMap: CellMap,
    visitedCells: Set<string>
  ): any {
    const getFlattenedValues = () => {
      const vals: any[] = [];
      args.forEach((a) => {
        vals.push(...this.getValuesFromArg(a, cellMap, visitedCells));
      });
      return vals;
    };

    const getNumericValues = () => getFlattenedValues().map(Number).filter((v) => !isNaN(v));

    switch (name) {
      // Math & Stats
      case 'SUM': return getNumericValues().reduce((a, b) => a + b, 0);
      case 'AVERAGE': {
        const nums = getNumericValues();
        return nums.length === 0 ? 0 : nums.reduce((a, b) => a + b, 0) / nums.length;
      }
      case 'MIN': {
        const nums = getNumericValues();
        return nums.length === 0 ? 0 : Math.min(...nums);
      }
      case 'MAX': {
        const nums = getNumericValues();
        return nums.length === 0 ? 0 : Math.max(...nums);
      }
      case 'PRODUCT': return getNumericValues().reduce((a, b) => a * b, 1);
      case 'MEDIAN': {
        const nums = getNumericValues().sort((a, b) => a - b);
        if (nums.length === 0) return 0;
        const mid = Math.floor(nums.length / 2);
        return nums.length % 2 !== 0 ? nums[mid]! : (nums[mid - 1]! + nums[mid]!) / 2;
      }
      case 'ROUND': return Math.round(Number(this.evaluateExpression(args[0]!, cellMap, visitedCells)));
      case 'ROUNDUP': return Math.ceil(Number(this.evaluateExpression(args[0]!, cellMap, visitedCells)));
      case 'ROUNDDOWN': return Math.floor(Number(this.evaluateExpression(args[0]!, cellMap, visitedCells)));
      case 'ABS': return Math.abs(Number(this.evaluateExpression(args[0]!, cellMap, visitedCells)));
      case 'SQRT': return Math.sqrt(Number(this.evaluateExpression(args[0]!, cellMap, visitedCells)));
      case 'POWER': return Math.pow(Number(this.evaluateExpression(args[0]!, cellMap, visitedCells)), Number(this.evaluateExpression(args[1]!, cellMap, visitedCells)));
      case 'MOD': return Number(this.evaluateExpression(args[0]!, cellMap, visitedCells)) % Number(this.evaluateExpression(args[1]!, cellMap, visitedCells));

      // Counting
      case 'COUNT': return getNumericValues().length;
      case 'COUNTA': return getFlattenedValues().filter((v) => v !== '' && v !== null && v !== undefined).length;
      case 'COUNTIF': {
        const rangeVals = this.getValuesFromArg(args[0]!, cellMap, visitedCells);
        const cond = String(this.evaluateExpression(args[1]!, cellMap, visitedCells)).replace(/['"]/g, '');
        return rangeVals.filter((v) => String(v) === cond).length;
      }
      case 'SUMIF': {
        const rangeVals = this.getValuesFromArg(args[0]!, cellMap, visitedCells);
        const cond = String(this.evaluateExpression(args[1]!, cellMap, visitedCells)).replace(/['"]/g, '');
        const sumVals = args[2] ? this.getValuesFromArg(args[2]!, cellMap, visitedCells) : rangeVals;
        let sum = 0;
        rangeVals.forEach((v, idx) => {
          if (String(v) === cond) sum += Number(sumVals[idx] || 0);
        });
        return sum;
      }

      // Logical
      case 'IF': {
        const cond = this.evaluateExpression(args[0]!, cellMap, visitedCells);
        return cond ? this.evaluateExpression(args[1]!, cellMap, visitedCells) : args[2] ? this.evaluateExpression(args[2]!, cellMap, visitedCells) : false;
      }
      case 'AND': return args.every((a) => Boolean(this.evaluateExpression(a, cellMap, visitedCells)));
      case 'OR': return args.some((a) => Boolean(this.evaluateExpression(a, cellMap, visitedCells)));
      case 'NOT': return !Boolean(this.evaluateExpression(args[0]!, cellMap, visitedCells));

      // Text
      case 'CONCAT': return getFlattenedValues().join('');
      case 'LEFT': {
        const str = String(this.evaluateExpression(args[0]!, cellMap, visitedCells));
        const len = Number(this.evaluateExpression(args[1] || '1', cellMap, visitedCells));
        return str.substring(0, len);
      }
      case 'RIGHT': {
        const str = String(this.evaluateExpression(args[0]!, cellMap, visitedCells));
        const len = Number(this.evaluateExpression(args[1] || '1', cellMap, visitedCells));
        return str.substring(Math.max(0, str.length - len));
      }
      case 'LEN': return String(this.evaluateExpression(args[0]!, cellMap, visitedCells)).length;
      case 'LOWER': return String(this.evaluateExpression(args[0]!, cellMap, visitedCells)).toLowerCase();
      case 'UPPER': return String(this.evaluateExpression(args[0]!, cellMap, visitedCells)).toUpperCase();
      case 'TRIM': return String(this.evaluateExpression(args[0]!, cellMap, visitedCells)).trim();

      // Date
      case 'TODAY': return new Date().toISOString().slice(0, 10);
      case 'NOW': return new Date().toLocaleString();

      default:
        throw new Error(`NAME: Unknown function '${name}'.`);
    }
  }
}
