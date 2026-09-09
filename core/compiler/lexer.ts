/**
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
    return this.isAtEnd() ? '\0' : this.source[this.pos];
  }

  private peekNext(): string {
    return (this.pos + 1 >= this.source.length) ? '\0' : this.source[this.pos + 1];
  }

  private advance(): string {
    const ch = this.source[this.pos++];
    if (ch === '\n') {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }
    return ch;
  }

  private isWhitespace(ch: string): boolean {
    return ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n';
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
    while (!this.isAtEnd() && this.peek() !== '\n') {
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

    if (this.peek() === '0' && (this.peekNext() === 'x' || this.peekNext() === 'X')) {
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
      if (this.peek() === '\\') {
        this.advance();
        const esc = this.advance();
        if (esc === 'n') strVal += '\n';
        else if (esc === 't') strVal += '\t';
        else if (esc === 'r') strVal += '\r';
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
