/**
 * @file applications/calculator/engine/ExpressionParser.ts
 * @description Safe Lexer, AST Parser, and Evaluator for arithmetic & scientific expressions (zero eval).
 */

import type { AngleUnit } from '../types.js';

export type TokenType = 'NUMBER' | 'OPERATOR' | 'IDENTIFIER' | 'LPAREN' | 'RPAREN' | 'COMMA';

export interface Token {
  type: TokenType;
  value: string;
}

export type ASTNode =
  | { type: 'Literal'; value: number }
  | { type: 'Binary'; operator: string; left: ASTNode; right: ASTNode }
  | { type: 'Unary'; operator: string; argument: ASTNode }
  | { type: 'FunctionCall'; name: string; args: ASTNode[] };

export class ExpressionParser {
  /**
   * Tokenizes an expression string.
   */
  public static tokenize(expr: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;
    const len = expr.length;

    while (i < len) {
      const char = expr[i]!;

      if (/\s/.test(char)) {
        i++;
        continue;
      }

      if (/\d|\./.test(char)) {
        let numStr = '';
        while (i < len && (/\d|\./.test(expr[i]!))) {
          numStr += expr[i];
          i++;
        }
        tokens.push({ type: 'NUMBER', value: numStr });
        continue;
      }

      if (/[a-zA-Z_]/.test(char)) {
        let idStr = '';
        while (i < len && /[a-zA-Z0-9_]/.test(expr[i]!)) {
          idStr += expr[i];
          i++;
        }
        tokens.push({ type: 'IDENTIFIER', value: idStr });
        continue;
      }

      if (char === '(') {
        tokens.push({ type: 'LPAREN', value: '(' });
        i++;
        continue;
      }

      if (char === ')') {
        tokens.push({ type: 'RPAREN', value: ')' });
        i++;
        continue;
      }

      if (char === ',') {
        tokens.push({ type: 'COMMA', value: ',' });
        i++;
        continue;
      }

      if (['+', '-', '*', '/', '%', '^'].includes(char)) {
        tokens.push({ type: 'OPERATOR', value: char });
        i++;
        continue;
      }

      throw new Error(`Unexpected character '${char}' in expression.`);
    }

    return tokens;
  }

  /**
   * Parses token stream into an Abstract Syntax Tree (AST).
   */
  public static parse(expr: string): ASTNode {
    const tokens = this.tokenize(expr);
    let index = 0;

    const peek = (): Token | undefined => tokens[index];
    const consume = (expectedType?: TokenType): Token => {
      const t = tokens[index];
      if (!t) throw new Error('Unexpected end of expression.');
      if (expectedType && t.type !== expectedType) {
        throw new Error(`Expected ${expectedType} but found ${t.type} '${t.value}'.`);
      }
      index++;
      return t;
    };

    // Expression -> Addition/Subtraction
    const parseExpression = (): ASTNode => {
      let left = parseTerm();
      while (peek() && peek()!.type === 'OPERATOR' && ['+', '-'].includes(peek()!.value)) {
        const op = consume().value;
        const right = parseTerm();
        left = { type: 'Binary', operator: op, left, right };
      }
      return left;
    };

    // Term -> Multiplication/Division/Modulus
    const parseTerm = (): ASTNode => {
      let left = parseFactor();
      while (peek() && peek()!.type === 'OPERATOR' && ['*', '/', '%'].includes(peek()!.value)) {
        const op = consume().value;
        const right = parseFactor();
        left = { type: 'Binary', operator: op, left, right };
      }
      return left;
    };

    // Factor -> Exponentiation
    const parseFactor = (): ASTNode => {
      let left = parseUnary();
      while (peek() && peek()!.type === 'OPERATOR' && peek()!.value === '^') {
        const op = consume().value;
        const right = parseUnary();
        left = { type: 'Binary', operator: op, left, right };
      }
      return left;
    };

    // Unary -> Negation / Plus
    const parseUnary = (): ASTNode => {
      if (peek() && peek()!.type === 'OPERATOR' && ['+', '-'].includes(peek()!.value)) {
        const op = consume().value;
        const arg = parseUnary();
        return { type: 'Unary', operator: op, argument: arg };
      }
      return parsePrimary();
    };

    // Primary -> Literal / FunctionCall / Constant / Parentheses
    const parsePrimary = (): ASTNode => {
      const token = peek();
      if (!token) throw new Error('Unexpected end of expression.');

      if (token.type === 'NUMBER') {
        const t = consume();
        const val = parseFloat(t.value);
        if (isNaN(val)) throw new Error(`Invalid number '${t.value}'.`);
        return { type: 'Literal', value: val };
      }

      if (token.type === 'IDENTIFIER') {
        const t = consume();
        const name = t.value;

        if (name.toUpperCase() === 'PI') return { type: 'Literal', value: Math.PI };
        if (name.toUpperCase() === 'E') return { type: 'Literal', value: Math.E };

        if (peek() && peek()!.type === 'LPAREN') {
          consume('LPAREN');
          const args: ASTNode[] = [];
          if (peek() && peek()!.type !== 'RPAREN') {
            args.push(parseExpression());
            while (peek() && peek()!.type === 'COMMA') {
              consume('COMMA');
              args.push(parseExpression());
            }
          }
          consume('RPAREN');
          return { type: 'FunctionCall', name, args };
        }

        throw new Error(`Unknown identifier '${name}'.`);
      }

      if (token.type === 'LPAREN') {
        consume('LPAREN');
        const exprNode = parseExpression();
        consume('RPAREN');
        return exprNode;
      }

      throw new Error(`Syntax error at '${token.value}'.`);
    };

    const ast = parseExpression();
    if (index < tokens.length) {
      throw new Error(`Unexpected trailing token '${tokens[index]!.value}'.`);
    }
    return ast;
  }

  /**
   * Evaluates AST node with specified angle unit (deg/rad).
   */
  public static evaluate(node: ASTNode, angleUnit: AngleUnit = 'rad'): number {
    switch (node.type) {
      case 'Literal':
        return node.value;

      case 'Unary': {
        const val = this.evaluate(node.argument, angleUnit);
        return node.operator === '-' ? -val : val;
      }

      case 'Binary': {
        const left = this.evaluate(node.left, angleUnit);
        const right = this.evaluate(node.right, angleUnit);

        switch (node.operator) {
          case '+': return left + right;
          case '-': return left - right;
          case '*': return left * right;
          case '/':
            if (right === 0) throw new Error('Division by zero.');
            return left / right;
          case '%': return left % right;
          case '^': return Math.pow(left, right);
          default: throw new Error(`Unsupported operator '${node.operator}'.`);
        }
      }

      case 'FunctionCall': {
        const fnName = node.name.toLowerCase();
        const evalArgs = node.args.map((a) => this.evaluate(a, angleUnit));
        const toRad = (val: number) => (angleUnit === 'deg' ? (val * Math.PI) / 180 : val);
        const fromRad = (val: number) => (angleUnit === 'deg' ? (val * 180) / Math.PI : val);

        const x = evalArgs[0] ?? 0;

        switch (fnName) {
          case 'sin': return Math.sin(toRad(x));
          case 'cos': return Math.cos(toRad(x));
          case 'tan': return Math.tan(toRad(x));
          case 'asin': return fromRad(Math.asin(x));
          case 'acos': return fromRad(Math.acos(x));
          case 'atan': return fromRad(Math.atan(x));
          case 'sinh': return Math.sinh(x);
          case 'cosh': return Math.cosh(x);
          case 'tanh': return Math.tanh(x);
          case 'log':
          case 'log10': return Math.log10(x);
          case 'ln': return Math.log(x);
          case 'sqrt':
            if (x < 0) throw new Error('Square root of negative number.');
            return Math.sqrt(x);
          case 'cbrt': return Math.cbrt(x);
          case 'abs': return Math.abs(x);
          case 'exp': return Math.exp(x);
          case 'pow': return Math.pow(x, evalArgs[1] ?? 1);
          case 'floor': return Math.floor(x);
          case 'ceil': return Math.ceil(x);
          case 'round': return Math.round(x);
          case 'factorial': {
            if (x < 0 || !Number.isInteger(x)) throw new Error('Factorial requires non-negative integer.');
            let res = 1;
            for (let i = 2; i <= x; i++) res *= i;
            return res;
          }
          default: throw new Error(`Unknown function '${fnName}'.`);
        }
      }
    }
  }

  /**
   * Helper to parse and evaluate an expression in a single call.
   */
  public static calculate(expr: string, angleUnit: AngleUnit = 'rad'): number {
    const ast = this.parse(expr);
    return this.evaluate(ast, angleUnit);
  }
}
