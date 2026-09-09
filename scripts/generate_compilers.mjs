import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function writeCode(relPath, content) {
  const fullPath = path.join(rootDir, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
}

console.log('Generating WebOS Compiler & Toolchain Suite...');

// 1. Tokens and Lexer
let lexerCode = `/**
 * WebOS Core Compiler Toolchain - Lexical Tokenizer & Stream Analyzer
 */

export enum TokenType {
  EOF = 'EOF',
  IDENTIFIER = 'IDENTIFIER',
  NUMBER = 'NUMBER',
  STRING = 'STRING',
  CHAR = 'CHAR',
  BOOLEAN = 'BOOLEAN',
  KEYWORD = 'KEYWORD',
  PUNCTUATION = 'PUNCTUATION',
  OPERATOR = 'OPERATOR',
  COMMENT = 'COMMENT',
}

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
  startOffset: number;
  endOffset: number;
}

export class CompilerLexer {
  private source: string;
  private pos: number = 0;
  private line: number = 1;
  private column: number = 1;

  public static readonly KEYWORDS = new Set([
    'fn', 'let', 'const', 'mut', 'if', 'else', 'while', 'for', 'in', 'return',
    'break', 'continue', 'struct', 'enum', 'impl', 'pub', 'use', 'import', 'export',
    'type', 'async', 'await', 'match', 'as', 'true', 'false', 'nil', 'self', 'Self',
    'int', 'i8', 'i16', 'i32', 'i64', 'u8', 'u16', 'u32', 'u64', 'f32', 'f64', 'bool', 'str', 'void'
  ]);

  constructor(source: string) {
    this.source = source;
  }

  public tokenize(): Token[] {
    const tokens: Token[] = [];
    while (!this.isAtEnd()) {
      const char = this.peek();
      if (this.isWhitespace(char)) {
        this.advance();
      } else if (char === '/' && this.peekNext() === '/') {
        this.skipLineComment();
      } else if (char === '/' && this.peekNext() === '*') {
        this.skipBlockComment();
      } else if (this.isDigit(char)) {
        tokens.push(this.scanNumber());
      } else if (this.isAlpha(char)) {
        tokens.push(this.scanIdentifierOrKeyword());
      } else if (char === '"' || char === "'") {
        tokens.push(this.scanString(char));
      } else if (this.isOperatorChar(char)) {
        tokens.push(this.scanOperator());
      } else {
        tokens.push({
          type: TokenType.PUNCTUATION,
          value: this.advance(),
          line: this.line,
          column: this.column,
          startOffset: this.pos - 1,
          endOffset: this.pos,
        });
      }
    }

    tokens.push({
      type: TokenType.EOF,
      value: '',
      line: this.line,
      column: this.column,
      startOffset: this.pos,
      endOffset: this.pos,
    });
    return tokens;
  }

  private isAtEnd(): boolean {
    return this.pos >= this.source.length;
  }

  private peek(): string {
    return this.isAtEnd() ? '\\0' : this.source[this.pos];
  }

  private peekNext(): string {
    return (this.pos + 1 >= this.source.length) ? '\\0' : this.source[this.pos + 1];
  }

  private advance(): string {
    const ch = this.source[this.pos++];
    if (ch === '\\n') {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }
    return ch;
  }

  private isWhitespace(ch: string): boolean {
    return ch === ' ' || ch === '\\t' || ch === '\\r' || ch === '\\n';
  }

  private isDigit(ch: string): boolean {
    return ch >= '0' && ch <= '9';
  }

  private isAlpha(ch: string): boolean {
    return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_';
  }

  private isAlphaNumeric(ch: string): boolean {
    return this.isAlpha(ch) || this.isDigit(ch);
  }

  private isOperatorChar(ch: string): boolean {
    return '+-*/%=!<>|&^~'.includes(ch);
  }

  private skipLineComment(): void {
    while (!this.isAtEnd() && this.peek() !== '\\n') {
      this.advance();
    }
  }

  private skipBlockComment(): void {
    this.advance(); // /
    this.advance(); // *
    while (!this.isAtEnd()) {
      if (this.peek() === '*' && this.peekNext() === '/') {
        this.advance();
        this.advance();
        break;
      }
      this.advance();
    }
  }

  private scanNumber(): Token {
    const startPos = this.pos;
    const startCol = this.column;
    let hasDot = false;
    let hasHex = false;

    if (this.peek() === '0' && (this.peekNext() === 'x' || this.peekNext() === 'X')) {
      hasHex = true;
      this.advance();
      this.advance();
      while (!this.isAtEnd() && (this.isDigit(this.peek()) || 'abcdefABCDEF'.includes(this.peek()))) {
        this.advance();
      }
    } else {
      while (!this.isAtEnd() && (this.isDigit(this.peek()) || (this.peek() === '.' && !hasDot && this.isDigit(this.peekNext())))) {
        if (this.peek() === '.') hasDot = true;
        this.advance();
      }
    }

    const value = this.source.substring(startPos, this.pos);
    return {
      type: TokenType.NUMBER,
      value,
      line: this.line,
      column: startCol,
      startOffset: startPos,
      endOffset: this.pos,
    };
  }

  private scanIdentifierOrKeyword(): Token {
    const startPos = this.pos;
    const startCol = this.column;
    while (!this.isAtEnd() && this.isAlphaNumeric(this.peek())) {
      this.advance();
    }

    const value = this.source.substring(startPos, this.pos);
    const type = CompilerLexer.KEYWORDS.has(value) ? TokenType.KEYWORD : TokenType.IDENTIFIER;

    return {
      type,
      value,
      line: this.line,
      column: startCol,
      startOffset: startPos,
      endOffset: this.pos,
    };
  }

  private scanString(quote: string): Token {
    const startPos = this.pos;
    const startCol = this.column;
    this.advance(); // opening quote
    let strVal = '';

    while (!this.isAtEnd() && this.peek() !== quote) {
      if (this.peek() === '\\\\') {
        this.advance();
        const esc = this.advance();
        if (esc === 'n') strVal += '\\n';
        else if (esc === 't') strVal += '\\t';
        else if (esc === 'r') strVal += '\\r';
        else if (esc === quote) strVal += quote;
        else strVal += esc;
      } else {
        strVal += this.advance();
      }
    }

    if (!this.isAtEnd()) {
      this.advance(); // closing quote
    }

    return {
      type: TokenType.STRING,
      value: strVal,
      line: this.line,
      column: startCol,
      startOffset: startPos,
      endOffset: this.pos,
    };
  }

  private scanOperator(): Token {
    const startPos = this.pos;
    const startCol = this.column;
    const ch1 = this.advance();
    const ch2 = this.peek();
    const twoChar = ch1 + ch2;

    if (['==', '!=', '<=', '>=', '&&', '||', '<<', '>>', '+=', '-=', '*=', '/=', '->', '=>'].includes(twoChar)) {
      this.advance();
      return {
        type: TokenType.OPERATOR,
        value: twoChar,
        line: this.line,
        column: startCol,
        startOffset: startPos,
        endOffset: this.pos,
      };
    }

    return {
      type: TokenType.OPERATOR,
      value: ch1,
      line: this.line,
      column: startCol,
      startOffset: startPos,
      endOffset: this.pos,
    };
  }
}
`;
writeCode('core/compiler/lexer.ts', lexerCode);

// 2. AST Nodes
let astCode = `/**
 * WebOS Core Compiler Toolchain - Abstract Syntax Tree (AST) Definitions
 */

export type ASTNodeType =
  | 'Program'
  | 'FunctionDeclaration'
  | 'VariableDeclaration'
  | 'StructDeclaration'
  | 'EnumDeclaration'
  | 'BlockStatement'
  | 'IfStatement'
  | 'WhileStatement'
  | 'ForStatement'
  | 'ReturnStatement'
  | 'ExpressionStatement'
  | 'BinaryExpression'
  | 'UnaryExpression'
  | 'CallExpression'
  | 'MemberExpression'
  | 'ArrayExpression'
  | 'ObjectExpression'
  | 'Identifier'
  | 'Literal'
  | 'TypeAnnotation';

export interface ASTNode {
  type: ASTNodeType;
  line: number;
  column: number;
}

export interface ProgramNode extends ASTNode {
  type: 'Program';
  body: ASTNode[];
}

export interface TypeAnnotationNode extends ASTNode {
  type: 'TypeAnnotation';
  name: string;
  isPointer?: boolean;
  isArray?: boolean;
  arraySize?: number;
  generics?: TypeAnnotationNode[];
}

export interface ParameterNode extends ASTNode {
  name: string;
  typeAnnotation: TypeAnnotationNode;
}

export interface FunctionDeclarationNode extends ASTNode {
  type: 'FunctionDeclaration';
  name: string;
  params: ParameterNode[];
  returnType: TypeAnnotationNode;
  body: BlockStatementNode;
  isAsync?: boolean;
  isPublic?: boolean;
}

export interface VariableDeclarationNode extends ASTNode {
  type: 'VariableDeclaration';
  name: string;
  isConst: boolean;
  typeAnnotation?: TypeAnnotationNode;
  initializer?: ASTNode;
}

export interface StructFieldNode extends ASTNode {
  name: string;
  typeAnnotation: TypeAnnotationNode;
}

export interface StructDeclarationNode extends ASTNode {
  type: 'StructDeclaration';
  name: string;
  fields: StructFieldNode[];
}

export interface BlockStatementNode extends ASTNode {
  type: 'BlockStatement';
  statements: ASTNode[];
}

export interface IfStatementNode extends ASTNode {
  type: 'IfStatement';
  condition: ASTNode;
  consequent: BlockStatementNode;
  alternate?: BlockStatementNode | IfStatementNode;
}

export interface WhileStatementNode extends ASTNode {
  type: 'WhileStatement';
  condition: ASTNode;
  body: BlockStatementNode;
}

export interface ReturnStatementNode extends ASTNode {
  type: 'ReturnStatement';
  argument?: ASTNode;
}

export interface ExpressionStatementNode extends ASTNode {
  type: 'ExpressionStatement';
  expression: ASTNode;
}

export interface BinaryExpressionNode extends ASTNode {
  type: 'BinaryExpression';
  operator: string;
  left: ASTNode;
  right: ASTNode;
}

export interface UnaryExpressionNode extends ASTNode {
  type: 'UnaryExpression';
  operator: string;
  argument: ASTNode;
  isPrefix: boolean;
}

export interface CallExpressionNode extends ASTNode {
  type: 'CallExpression';
  callee: ASTNode;
  arguments: ASTNode[];
}

export interface IdentifierNode extends ASTNode {
  type: 'Identifier';
  name: string;
}

export interface LiteralNode extends ASTNode {
  type: 'Literal';
  value: any;
  raw: string;
  literalType: 'number' | 'string' | 'boolean' | 'null';
}
`;
writeCode('core/compiler/ast.ts', astCode);

// 3. Parser
let parserCode = `/**
 * WebOS Core Compiler Toolchain - Recursive Descent AST Parser
 */

import { Token, TokenType } from './lexer';
import * as AST from './ast';

export class CompilerParser {
  private tokens: Token[];
  private current: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  public parse(): AST.ProgramNode {
    const body: AST.ASTNode[] = [];
    while (!this.isAtEnd()) {
      body.push(this.parseDeclaration());
    }
    return {
      type: 'Program',
      body,
      line: 1,
      column: 1,
    };
  }

  private parseDeclaration(): AST.ASTNode {
    if (this.matchKeyword('fn')) {
      return this.parseFunctionDeclaration();
    }
    if (this.matchKeyword('let') || this.matchKeyword('const')) {
      return this.parseVariableDeclaration();
    }
    if (this.matchKeyword('struct')) {
      return this.parseStructDeclaration();
    }
    return this.parseStatement();
  }

  private parseFunctionDeclaration(): AST.FunctionDeclarationNode {
    const fnToken = this.previous();
    const nameToken = this.consume(TokenType.IDENTIFIER, 'Expected function name');
    this.consume(TokenType.PUNCTUATION, 'Expected ( after function name', '(');

    const params: AST.ParameterNode[] = [];
    if (!this.checkPunctuation(')')) {
      do {
        const pName = this.consume(TokenType.IDENTIFIER, 'Expected parameter name').value;
        this.consume(TokenType.PUNCTUATION, 'Expected : after parameter name', ':');
        const pType = this.parseTypeAnnotation();
        params.push({
          type: 'Identifier',
          name: pName,
          typeAnnotation: pType,
          line: fnToken.line,
          column: fnToken.column,
        });
      } while (this.matchPunctuation(','));
    }
    this.consume(TokenType.PUNCTUATION, 'Expected ) after parameters', ')');

    let returnType: AST.TypeAnnotationNode = {
      type: 'TypeAnnotation',
      name: 'void',
      line: fnToken.line,
      column: fnToken.column,
    };

    if (this.matchOperator('->') || this.matchPunctuation(':')) {
      returnType = this.parseTypeAnnotation();
    }

    const body = this.parseBlockStatement();
    return {
      type: 'FunctionDeclaration',
      name: nameToken.value,
      params,
      returnType,
      body,
      line: fnToken.line,
      column: fnToken.column,
    };
  }

  private parseVariableDeclaration(): AST.VariableDeclarationNode {
    const kwToken = this.previous();
    const isConst = kwToken.value === 'const';
    const name = this.consume(TokenType.IDENTIFIER, 'Expected variable name').value;

    let typeAnnotation: AST.TypeAnnotationNode | undefined;
    if (this.matchPunctuation(':')) {
      typeAnnotation = this.parseTypeAnnotation();
    }

    let initializer: AST.ASTNode | undefined;
    if (this.matchOperator('=')) {
      initializer = this.parseExpression();
    }
    this.matchPunctuation(';');

    return {
      type: 'VariableDeclaration',
      name,
      isConst,
      typeAnnotation,
      initializer,
      line: kwToken.line,
      column: kwToken.column,
    };
  }

  private parseStructDeclaration(): AST.StructDeclarationNode {
    const structToken = this.previous();
    const name = this.consume(TokenType.IDENTIFIER, 'Expected struct name').value;
    this.consume(TokenType.PUNCTUATION, 'Expected {', '{');

    const fields: AST.StructFieldNode[] = [];
    while (!this.checkPunctuation('}') && !this.isAtEnd()) {
      const fName = this.consume(TokenType.IDENTIFIER, 'Expected field name').value;
      this.consume(TokenType.PUNCTUATION, 'Expected :', ':');
      const fType = this.parseTypeAnnotation();
      this.matchPunctuation(';');
      fields.push({
        type: 'Identifier',
        name: fName,
        typeAnnotation: fType,
        line: structToken.line,
        column: structToken.column,
      });
    }
    this.consume(TokenType.PUNCTUATION, 'Expected }', '}');

    return {
      type: 'StructDeclaration',
      name,
      fields,
      line: structToken.line,
      column: structToken.column,
    };
  }

  private parseStatement(): AST.ASTNode {
    if (this.matchKeyword('if')) return this.parseIfStatement();
    if (this.matchKeyword('while')) return this.parseWhileStatement();
    if (this.matchKeyword('return')) return this.parseReturnStatement();
    if (this.matchPunctuation('{')) return this.parseBlockStatementBody();
    return this.parseExpressionStatement();
  }

  private parseIfStatement(): AST.IfStatementNode {
    const ifToken = this.previous();
    const condition = this.parseExpression();
    const consequent = this.parseBlockStatement();
    let alternate: AST.BlockStatementNode | AST.IfStatementNode | undefined;

    if (this.matchKeyword('else')) {
      if (this.matchKeyword('if')) {
        alternate = this.parseIfStatement();
      } else {
        alternate = this.parseBlockStatement();
      }
    }

    return {
      type: 'IfStatement',
      condition,
      consequent,
      alternate,
      line: ifToken.line,
      column: ifToken.column,
    };
  }

  private parseWhileStatement(): AST.WhileStatementNode {
    const token = this.previous();
    const condition = this.parseExpression();
    const body = this.parseBlockStatement();
    return {
      type: 'WhileStatement',
      condition,
      body,
      line: token.line,
      column: token.column,
    };
  }

  private parseReturnStatement(): AST.ReturnStatementNode {
    const token = this.previous();
    let argument: AST.ASTNode | undefined;
    if (!this.checkPunctuation(';')) {
      argument = this.parseExpression();
    }
    this.matchPunctuation(';');
    return {
      type: 'ReturnStatement',
      argument,
      line: token.line,
      column: token.column,
    };
  }

  private parseBlockStatement(): AST.BlockStatementNode {
    this.consume(TokenType.PUNCTUATION, 'Expected {', '{');
    return this.parseBlockStatementBody();
  }

  private parseBlockStatementBody(): AST.BlockStatementNode {
    const token = this.previous();
    const statements: AST.ASTNode[] = [];
    while (!this.checkPunctuation('}') && !this.isAtEnd()) {
      statements.push(this.parseDeclaration());
    }
    this.consume(TokenType.PUNCTUATION, 'Expected }', '}');
    return {
      type: 'BlockStatement',
      statements,
      line: token.line,
      column: token.column,
    };
  }

  private parseExpressionStatement(): AST.ExpressionStatementNode {
    const expr = this.parseExpression();
    this.matchPunctuation(';');
    return {
      type: 'ExpressionStatement',
      expression: expr,
      line: expr.line,
      column: expr.column,
    };
  }

  public parseExpression(): AST.ASTNode {
    return this.parseAssignment();
  }

  private parseAssignment(): AST.ASTNode {
    const expr = this.parseLogicalOr();
    if (this.matchOperator('=')) {
      const value = this.parseAssignment();
      return {
        type: 'BinaryExpression',
        operator: '=',
        left: expr,
        right: value,
        line: expr.line,
        column: expr.column,
      };
    }
    return expr;
  }

  private parseLogicalOr(): AST.ASTNode {
    let expr = this.parseLogicalAnd();
    while (this.matchOperator('||')) {
      const op = this.previous().value;
      const right = this.parseLogicalAnd();
      expr = {
        type: 'BinaryExpression',
        operator: op,
        left: expr,
        right,
        line: expr.line,
        column: expr.column,
      };
    }
    return expr;
  }

  private parseLogicalAnd(): AST.ASTNode {
    let expr = this.parseEquality();
    while (this.matchOperator('&&')) {
      const op = this.previous().value;
      const right = this.parseEquality();
      expr = {
        type: 'BinaryExpression',
        operator: op,
        left: expr,
        right,
        line: expr.line,
        column: expr.column,
      };
    }
    return expr;
  }

  private parseEquality(): AST.ASTNode {
    let expr = this.parseComparison();
    while (this.matchOperator('==') || this.matchOperator('!=')) {
      const op = this.previous().value;
      const right = this.parseComparison();
      expr = {
        type: 'BinaryExpression',
        operator: op,
        left: expr,
        right,
        line: expr.line,
        column: expr.column,
      };
    }
    return expr;
  }

  private parseComparison(): AST.ASTNode {
    let expr = this.parseAddition();
    while (this.matchOperator('<') || this.matchOperator('<=') || this.matchOperator('>') || this.matchOperator('>=')) {
      const op = this.previous().value;
      const right = this.parseAddition();
      expr = {
        type: 'BinaryExpression',
        operator: op,
        left: expr,
        right,
        line: expr.line,
        column: expr.column,
      };
    }
    return expr;
  }

  private parseAddition(): AST.ASTNode {
    let expr = this.parseMultiplication();
    while (this.matchOperator('+') || this.matchOperator('-')) {
      const op = this.previous().value;
      const right = this.parseMultiplication();
      expr = {
        type: 'BinaryExpression',
        operator: op,
        left: expr,
        right,
        line: expr.line,
        column: expr.column,
      };
    }
    return expr;
  }

  private parseMultiplication(): AST.ASTNode {
    let expr = this.parseUnary();
    while (this.matchOperator('*') || this.matchOperator('/') || this.matchOperator('%')) {
      const op = this.previous().value;
      const right = this.parseUnary();
      expr = {
        type: 'BinaryExpression',
        operator: op,
        left: expr,
        right,
        line: expr.line,
        column: expr.column,
      };
    }
    return expr;
  }

  private parseUnary(): AST.ASTNode {
    if (this.matchOperator('!') || this.matchOperator('-') || this.matchOperator('~')) {
      const op = this.previous().value;
      const right = this.parseUnary();
      return {
        type: 'UnaryExpression',
        operator: op,
        argument: right,
        isPrefix: true,
        line: right.line,
        column: right.column,
      };
    }
    return this.parseCall();
  }

  private parseCall(): AST.ASTNode {
    let expr = this.parsePrimary();
    while (true) {
      if (this.matchPunctuation('(')) {
        expr = this.finishCall(expr);
      } else {
        break;
      }
    }
    return expr;
  }

  private finishCall(callee: AST.ASTNode): AST.CallExpressionNode {
    const args: AST.ASTNode[] = [];
    if (!this.checkPunctuation(')')) {
      do {
        args.push(this.parseExpression());
      } while (this.matchPunctuation(','));
    }
    this.consume(TokenType.PUNCTUATION, 'Expected ) after arguments', ')');
    return {
      type: 'CallExpression',
      callee,
      arguments: args,
      line: callee.line,
      column: callee.column,
    };
  }

  private parsePrimary(): AST.ASTNode {
    const token = this.peek();
    if (this.match(TokenType.NUMBER)) {
      const prev = this.previous();
      return {
        type: 'Literal',
        value: Number(prev.value),
        raw: prev.value,
        literalType: 'number',
        line: prev.line,
        column: prev.column,
      };
    }
    if (this.match(TokenType.STRING)) {
      const prev = this.previous();
      return {
        type: 'Literal',
        value: prev.value,
        raw: prev.value,
        literalType: 'string',
        line: prev.line,
        column: prev.column,
      };
    }
    if (this.matchKeyword('true') || this.matchKeyword('false')) {
      const prev = this.previous();
      return {
        type: 'Literal',
        value: prev.value === 'true',
        raw: prev.value,
        literalType: 'boolean',
        line: prev.line,
        column: prev.column,
      };
    }
    if (this.match(TokenType.IDENTIFIER)) {
      const prev = this.previous();
      return {
        type: 'Identifier',
        name: prev.value,
        line: prev.line,
        column: prev.column,
      };
    }
    if (this.matchPunctuation('(')) {
      const expr = this.parseExpression();
      this.consume(TokenType.PUNCTUATION, 'Expected )', ')');
      return expr;
    }

    throw new Error(\`SyntaxError at line \${token.line}, col \${token.column}: Unexpected token '\${token.value}'\`);
  }

  private parseTypeAnnotation(): AST.TypeAnnotationNode {
    const nameToken = this.consume(TokenType.IDENTIFIER, 'Expected type name');
    let isArray = false;
    if (this.matchPunctuation('[')) {
      isArray = true;
      this.consume(TokenType.PUNCTUATION, 'Expected ]', ']');
    }

    return {
      type: 'TypeAnnotation',
      name: nameToken.value,
      isArray,
      line: nameToken.line,
      column: nameToken.column,
    };
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private checkPunctuation(val: string): boolean {
    return this.check(TokenType.PUNCTUATION) && this.peek().value === val;
  }

  private match(type: TokenType): boolean {
    if (this.check(type)) {
      this.advance();
      return true;
    }
    return false;
  }

  private matchKeyword(kw: string): boolean {
    if (this.check(TokenType.KEYWORD) && this.peek().value === kw) {
      this.advance();
      return true;
    }
    return false;
  }

  private matchPunctuation(val: string): boolean {
    if (this.check(TokenType.PUNCTUATION) && this.peek().value === val) {
      this.advance();
      return true;
    }
    return false;
  }

  private matchOperator(val: string): boolean {
    if (this.check(TokenType.OPERATOR) && this.peek().value === val) {
      this.advance();
      return true;
    }
    return false;
  }

  private consume(type: TokenType, message: string, value?: string): Token {
    if (this.check(type) && (!value || this.peek().value === value)) {
      return this.advance();
    }
    const token = this.peek();
    throw new Error(\`ParseError at line \${token.line}, col \${token.column}: \${message}. Got '\${token.value}'\`);
  }
}
`;
writeCode('core/compiler/parser.ts', parserCode);

// 4. Bytecode Virtual Machine & Code Generator
let vmCode = `/**
 * WebOS Core Compiler Toolchain - Bytecode Virtual Machine (Stack Machine)
 */

export enum Opcode {
  OP_HALT = 0x00,
  OP_CONST = 0x01,
  OP_ADD = 0x02,
  OP_SUB = 0x03,
  OP_MUL = 0x04,
  OP_DIV = 0x05,
  OP_MOD = 0x06,
  OP_EQ = 0x07,
  OP_NE = 0x08,
  OP_LT = 0x09,
  OP_LE = 0x0A,
  OP_GT = 0x0B,
  OP_GE = 0x0C,
  OP_NOT = 0x0D,
  OP_LOAD_LOCAL = 0x0E,
  OP_STORE_LOCAL = 0x0F,
  OP_LOAD_GLOBAL = 0x10,
  OP_STORE_GLOBAL = 0x11,
  OP_JUMP = 0x12,
  OP_JUMP_IF_FALSE = 0x13,
  OP_CALL = 0x14,
  OP_RET = 0x15,
  OP_PRINT = 0x16,
  OP_POP = 0x17,
}

export interface BytecodeChunk {
  code: number[];
  constants: any[];
  lines: number[];
}

export class BytecodeVM {
  private stack: any[] = [];
  private globals: Map<string, any> = new Map();
  private ip: number = 0;
  private outputLogs: string[] = [];

  public run(chunk: BytecodeChunk): { output: string[]; result: any } {
    this.ip = 0;
    this.stack = [];
    this.outputLogs = [];
    const code = chunk.code;
    const constants = chunk.constants;

    while (this.ip < code.length) {
      const instruction = code[this.ip++];

      switch (instruction) {
        case Opcode.OP_HALT:
          return { output: this.outputLogs, result: this.stack.pop() };

        case Opcode.OP_CONST: {
          const constIdx = code[this.ip++];
          this.stack.push(constants[constIdx]);
          break;
        }

        case Opcode.OP_ADD: {
          const b = this.stack.pop();
          const a = this.stack.pop();
          this.stack.push(a + b);
          break;
        }

        case Opcode.OP_SUB: {
          const b = this.stack.pop();
          const a = this.stack.pop();
          this.stack.push(a - b);
          break;
        }

        case Opcode.OP_MUL: {
          const b = this.stack.pop();
          const a = this.stack.pop();
          this.stack.push(a * b);
          break;
        }

        case Opcode.OP_DIV: {
          const b = this.stack.pop();
          const a = this.stack.pop();
          this.stack.push(Math.floor(a / b));
          break;
        }

        case Opcode.OP_EQ: {
          const b = this.stack.pop();
          const a = this.stack.pop();
          this.stack.push(a === b);
          break;
        }

        case Opcode.OP_LT: {
          const b = this.stack.pop();
          const a = this.stack.pop();
          this.stack.push(a < b);
          break;
        }

        case Opcode.OP_GT: {
          const b = this.stack.pop();
          const a = this.stack.pop();
          this.stack.push(a > b);
          break;
        }

        case Opcode.OP_JUMP: {
          const target = code[this.ip++];
          this.ip = target;
          break;
        }

        case Opcode.OP_JUMP_IF_FALSE: {
          const target = code[this.ip++];
          const cond = this.stack.pop();
          if (!cond) {
            this.ip = target;
          }
          break;
        }

        case Opcode.OP_STORE_GLOBAL: {
          const name = constants[code[this.ip++]];
          const val = this.stack.pop();
          this.globals.set(name, val);
          break;
        }

        case Opcode.OP_LOAD_GLOBAL: {
          const name = constants[code[this.ip++]];
          this.stack.push(this.globals.get(name));
          break;
        }

        case Opcode.OP_PRINT: {
          const val = this.stack.pop();
          this.outputLogs.push(String(val));
          break;
        }

        case Opcode.OP_POP: {
          this.stack.pop();
          break;
        }

        default:
          throw new Error(\`Unknown opcode 0x\${instruction.toString(16)} at IP \${this.ip - 1}\`);
      }
    }

    return { output: this.outputLogs, result: this.stack.pop() };
  }
}
`;
writeCode('core/compiler/vm.ts', vmCode);

// 5. Code Generator from AST to Bytecode
let codegenCode = `/**
 * WebOS Core Compiler Toolchain - Bytecode Code Generator
 */

import * as AST from './ast';
import { Opcode, BytecodeChunk } from './vm';

export class CodeGenerator {
  private chunk: BytecodeChunk = {
    code: [],
    constants: [],
    lines: [],
  };

  public generate(program: AST.ProgramNode): BytecodeChunk {
    for (const stmt of program.body) {
      this.compileNode(stmt);
    }
    this.emit(Opcode.OP_HALT);
    return this.chunk;
  }

  private compileNode(node: AST.ASTNode): void {
    switch (node.type) {
      case 'VariableDeclaration': {
        const varNode = node as AST.VariableDeclarationNode;
        if (varNode.initializer) {
          this.compileNode(varNode.initializer);
        } else {
          this.emitConstant(0);
        }
        const constIdx = this.addConstant(varNode.name);
        this.emit(Opcode.OP_STORE_GLOBAL, constIdx);
        break;
      }

      case 'ExpressionStatement': {
        const exprStmt = node as AST.ExpressionStatementNode;
        this.compileNode(exprStmt.expression);
        this.emit(Opcode.OP_POP);
        break;
      }

      case 'BinaryExpression': {
        const bin = node as AST.BinaryExpressionNode;
        if (bin.operator === '=') {
          this.compileNode(bin.right);
          if (bin.left.type === 'Identifier') {
            const constIdx = this.addConstant((bin.left as AST.IdentifierNode).name);
            this.emit(Opcode.OP_STORE_GLOBAL, constIdx);
          }
          return;
        }

        this.compileNode(bin.left);
        this.compileNode(bin.right);

        switch (bin.operator) {
          case '+': this.emit(Opcode.OP_ADD); break;
          case '-': this.emit(Opcode.OP_SUB); break;
          case '*': this.emit(Opcode.OP_MUL); break;
          case '/': this.emit(Opcode.OP_DIV); break;
          case '==': this.emit(Opcode.OP_EQ); break;
          case '<': this.emit(Opcode.OP_LT); break;
          case '>': this.emit(Opcode.OP_GT); break;
        }
        break;
      }

      case 'Literal': {
        const lit = node as AST.LiteralNode;
        this.emitConstant(lit.value);
        break;
      }

      case 'Identifier': {
        const ident = node as AST.IdentifierNode;
        const constIdx = this.addConstant(ident.name);
        this.emit(Opcode.OP_LOAD_GLOBAL, constIdx);
        break;
      }

      case 'CallExpression': {
        const call = node as AST.CallExpressionNode;
        if (call.callee.type === 'Identifier' && (call.callee as AST.IdentifierNode).name === 'print') {
          for (const arg of call.arguments) {
            this.compileNode(arg);
            this.emit(Opcode.OP_PRINT);
          }
        }
        break;
      }
    }
  }

  private addConstant(value: any): number {
    const idx = this.chunk.constants.indexOf(value);
    if (idx !== -1) return idx;
    this.chunk.constants.push(value);
    return this.chunk.constants.length - 1;
  }

  private emit(...bytes: number[]): void {
    this.chunk.code.push(...bytes);
  }

  private emitConstant(value: any): void {
    const idx = this.addConstant(value);
    this.emit(Opcode.OP_CONST, idx);
  }
}
`;
writeCode('core/compiler/codegen.ts', codegenCode);

// 6. Master Compiler API
let compilerIndex = `/**
 * WebOS Core Compiler Toolchain Master Index
 */

export * from './lexer';
export * from './ast';
export * from './parser';
export * from './vm';
export * from './codegen';

import { CompilerLexer } from './lexer';
import { CompilerParser } from './parser';
import { CodeGenerator } from './codegen';
import { BytecodeVM } from './vm';

export class WebOSCompiler {
  public static compileAndRun(sourceCode: string): { output: string[]; result: any } {
    const lexer = new CompilerLexer(sourceCode);
    const tokens = lexer.tokenize();
    const parser = new CompilerParser(tokens);
    const ast = parser.parse();
    const codegen = new CodeGenerator();
    const chunk = codegen.generate(ast);
    const vm = new BytecodeVM();
    return vm.run(chunk);
  }
}
`;
writeCode('core/compiler/index.ts', compilerIndex);

console.log('Compiler toolchain generated successfully.');
