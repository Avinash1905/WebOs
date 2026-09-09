/**
 * WebOS Core - Shell Command Line Lexer & Tokenizer
 * Tokenizes complex Unix command strings with quotes, escapes, variables, pipes, and redirects.
 */

export type TokenType =
  | 'WORD'
  | 'PIPE'          // |
  | 'REDIRECT_OUT'  // >
  | 'REDIRECT_APP'  // >>
  | 'REDIRECT_IN'   // <
  | 'AND_IF'        // &&
  | 'OR_IF'         // ||
  | 'SEMI'          // ;
  | 'AMP'           // &
  | 'EOF';

export interface Token {
  type: TokenType;
  value: string;
  position: number;
}

export class ShellLexer {
  private input: string;
  private pos: number = 0;

  constructor(input: string) {
    this.input = input;
  }

  public tokenize(): Token[] {
    const tokens: Token[] = [];
    while (this.pos < this.input.length) {
      this.skipWhitespace();
      if (this.pos >= this.input.length) break;

      const char = this.input[this.pos];
      const nextChar = this.pos + 1 < this.input.length ? this.input[this.pos + 1] : '';

      // Check double-char operators
      if (char === '&' && nextChar === '&') {
        tokens.push({ type: 'AND_IF', value: '&&', position: this.pos });
        this.pos += 2;
        continue;
      }
      if (char === '|' && nextChar === '|') {
        tokens.push({ type: 'OR_IF', value: '||', position: this.pos });
        this.pos += 2;
        continue;
      }
      if (char === '>' && nextChar === '>') {
        tokens.push({ type: 'REDIRECT_APP', value: '>>', position: this.pos });
        this.pos += 2;
        continue;
      }

      // Check single-char operators
      if (char === '|') {
        tokens.push({ type: 'PIPE', value: '|', position: this.pos++ });
        continue;
      }
      if (char === '>') {
        tokens.push({ type: 'REDIRECT_OUT', value: '>', position: this.pos++ });
        continue;
      }
      if (char === '<') {
        tokens.push({ type: 'REDIRECT_IN', value: '<', position: this.pos++ });
        continue;
      }
      if (char === ';') {
        tokens.push({ type: 'SEMI', value: ';', position: this.pos++ });
        continue;
      }
      if (char === '&') {
        tokens.push({ type: 'AMP', value: '&', position: this.pos++ });
        continue;
      }

      // Parse Word / String
      tokens.push(this.readWord());
    }

    tokens.push({ type: 'EOF', value: '', position: this.pos });
    return tokens;
  }

  private skipWhitespace() {
    while (this.pos < this.input.length && /\s/.test(this.input[this.pos])) {
      this.pos++;
    }
  }

  private readWord(): Token {
    const startPos = this.pos;
    let value = '';
    let inSingleQuote = false;
    let inDoubleQuote = false;

    while (this.pos < this.input.length) {
      const c = this.input[this.pos];

      if (c === '\\' && !inSingleQuote) {
        this.pos++;
        if (this.pos < this.input.length) {
          value += this.input[this.pos++];
        }
        continue;
      }

      if (c === "'" && !inDoubleQuote) {
        inSingleQuote = !inSingleQuote;
        this.pos++;
        continue;
      }

      if (c === '"' && !inSingleQuote) {
        inDoubleQuote = !inDoubleQuote;
        this.pos++;
        continue;
      }

      if (!inSingleQuote && !inDoubleQuote) {
        if (/\s/.test(c) || ['|', '>', '<', ';', '&'].includes(c)) {
          break;
        }
      }

      value += c;
      this.pos++;
    }

    return {
      type: 'WORD',
      value,
      position: startPos,
    };
  }
}
