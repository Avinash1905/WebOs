/**
 * @file PosixLexer.ts
 * @description POSIX shell lexical token scanner.
 */

export type TokenType =
  | 'WORD'
  | 'PIPE' // |
  | 'AND' // &&
  | 'OR' // ||
  | 'SEMICOLON' // ;
  | 'REDIRECT_OUT' // >
  | 'REDIRECT_APPEND' // >>
  | 'REDIRECT_IN' // <
  | 'BACKGROUND' // &
  | 'LPAREN' // (
  | 'RPAREN' // )
  | 'EOF';

export interface Token {
  readonly type: TokenType;
  readonly value: string;
  readonly position: number;
}

export class PosixLexer {
  public static tokenize(input: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;
    const len = input.length;

    while (i < len) {
      const c = input[i];

      // Whitespace
      if (!c || /\s/.test(c)) {
        i++;
        continue;
      }

      // Comments
      if (c === '#') {
        break; // comment till end of line
      }

      // Multi-char operators
      if (c === '&' && input[i + 1] === '&') {
        tokens.push({ type: 'AND', value: '&&', position: i });
        i += 2;
        continue;
      }
      if (c === '|' && input[i + 1] === '|') {
        tokens.push({ type: 'OR', value: '||', position: i });
        i += 2;
        continue;
      }
      if (c === '>' && input[i + 1] === '>') {
        tokens.push({ type: 'REDIRECT_APPEND', value: '>>', position: i });
        i += 2;
        continue;
      }

      // Single char operators
      if (c === '|') {
        tokens.push({ type: 'PIPE', value: '|', position: i });
        i++;
        continue;
      }
      if (c === ';') {
        tokens.push({ type: 'SEMICOLON', value: ';', position: i });
        i++;
        continue;
      }
      if (c === '>') {
        tokens.push({ type: 'REDIRECT_OUT', value: '>', position: i });
        i++;
        continue;
      }
      if (c === '<') {
        tokens.push({ type: 'REDIRECT_IN', value: '<', position: i });
        i++;
        continue;
      }
      if (c === '&') {
        tokens.push({ type: 'BACKGROUND', value: '&', position: i });
        i++;
        continue;
      }
      if (c === '(') {
        tokens.push({ type: 'LPAREN', value: '(', position: i });
        i++;
        continue;
      }
      if (c === ')') {
        tokens.push({ type: 'RPAREN', value: ')', position: i });
        i++;
        continue;
      }

      // Word / String literals (handles quotes)
      const startPos = i;
      let word = '';
      let inSingleQuote = false;
      let inDoubleQuote = false;

      while (i < len) {
        const char = input[i];

        if (char === "'" && !inDoubleQuote) {
          inSingleQuote = !inSingleQuote;
          i++;
          continue;
        }

        if (char === '"' && !inSingleQuote) {
          inDoubleQuote = !inDoubleQuote;
          i++;
          continue;
        }

        if (char === '\\' && (inDoubleQuote || !inSingleQuote) && i + 1 < len) {
          word += input[i + 1];
          i += 2;
          continue;
        }

        if (!inSingleQuote && !inDoubleQuote && char && /[\s|;&><()#]/.test(char)) {
          break;
        }

        word += char;
        i++;
      }

      tokens.push({ type: 'WORD', value: word, position: startPos });
    }

    tokens.push({ type: 'EOF', value: '', position: len });
    return tokens;
  }
}
