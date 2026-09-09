/**
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

    throw new Error(`SyntaxError at line ${token.line}, col ${token.column}: Unexpected token '${token.value}'`);
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
    throw new Error(`ParseError at line ${token.line}, col ${token.column}: ${message}. Got '${token.value}'`);
  }
}
