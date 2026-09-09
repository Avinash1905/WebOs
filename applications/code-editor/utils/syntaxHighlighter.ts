/**
 * @file applications/code-editor/utils/syntaxHighlighter.ts
 * @description Lightweight tokenizer and syntax highlighter for 12+ programming languages.
 */

export interface Token {
  text: string;
  type: 'keyword' | 'string' | 'number' | 'comment' | 'operator' | 'type' | 'function' | 'plain';
}

const JS_KEYWORDS = new Set([
  'import', 'export', 'from', 'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for',
  'while', 'do', 'switch', 'case', 'break', 'continue', 'class', 'extends', 'super', 'new', 'this',
  'async', 'await', 'try', 'catch', 'finally', 'throw', 'typeof', 'instanceof', 'void', 'delete',
  'null', 'undefined', 'true', 'false', 'interface', 'type', 'enum', 'implements', 'readonly',
]);

const PY_KEYWORDS = new Set([
  'def', 'class', 'import', 'from', 'as', 'return', 'if', 'elif', 'else', 'for', 'while', 'in',
  'is', 'not', 'and', 'or', 'try', 'except', 'finally', 'raise', 'with', 'lambda', 'global',
  'nonlocal', 'pass', 'break', 'continue', 'True', 'False', 'None', 'self',
]);

const C_KEYWORDS = new Set([
  'int', 'char', 'float', 'double', 'void', 'long', 'short', 'struct', 'typedef', 'union',
  'enum', 'const', 'static', 'extern', 'volatile', 'auto', 'register', 'return', 'if', 'else',
  'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'sizeof', 'include', 'define',
]);

const SQL_KEYWORDS = new Set([
  'SELECT', 'FROM', 'WHERE', 'INSERT', 'INTO', 'UPDATE', 'DELETE', 'CREATE', 'TABLE', 'DROP',
  'ALTER', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'ON', 'GROUP', 'BY', 'ORDER', 'HAVING',
  'LIMIT', 'AND', 'OR', 'NOT', 'NULL', 'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'VALUES',
  'select', 'from', 'where', 'insert', 'into', 'update', 'delete', 'create', 'table', 'drop',
  'join', 'on', 'group', 'by', 'order', 'limit', 'and', 'or', 'not', 'null',
]);

export function detectLanguageFromPath(path: string | null): string {
  if (!path) return 'plaintext';
  const ext = path.split('.').pop()?.toLowerCase() || '';
  switch (ext) {
    case 'js': case 'jsx': return 'javascript';
    case 'ts': case 'tsx': return 'typescript';
    case 'html': case 'htm': return 'html';
    case 'css': case 'scss': case 'less': return 'css';
    case 'json': return 'json';
    case 'md': case 'markdown': return 'markdown';
    case 'py': return 'python';
    case 'java': return 'java';
    case 'c': case 'cpp': case 'h': case 'hpp': return 'c';
    case 'sql': return 'sql';
    case 'sh': case 'bash': case 'zsh': return 'shell';
    default: return 'plaintext';
  }
}

export function tokenizeLine(line: string, language: string): Token[] {
  if (language === 'plaintext' || !line.trim()) {
    return [{ text: line, type: 'plain' }];
  }

  const tokens: Token[] = [];
  let index = 0;
  const len = line.length;

  while (index < len) {
    const char = line[index]!;

    // Single-line Comments
    if (
      (char === '/' && line[index + 1] === '/') ||
      (char === '#' && language !== 'markdown') ||
      (char === '-' && line[index + 1] === '-' && language === 'sql')
    ) {
      tokens.push({ text: line.substring(index), type: 'comment' });
      break;
    }

    // Strings
    if (char === '"' || char === "'" || char === '`') {
      const quote = char;
      let start = index;
      index++;
      while (index < len && line[index] !== quote) {
        if (line[index] === '\\') index++;
        index++;
      }
      index++; // consume closing quote
      tokens.push({ text: line.substring(start, index), type: 'string' });
      continue;
    }

    // Numbers
    if (/\d/.test(char)) {
      let start = index;
      while (index < len && /[\d._]/.test(line[index]!)) {
        index++;
      }
      tokens.push({ text: line.substring(start, index), type: 'number' });
      continue;
    }

    // Identifiers & Keywords
    if (/[a-zA-Z_$]/.test(char)) {
      let start = index;
      while (index < len && /[a-zA-Z0-9_$]/.test(line[index]!)) {
        index++;
      }
      const word = line.substring(start, index);

      let isKeyword = false;
      if (language === 'javascript' || language === 'typescript') isKeyword = JS_KEYWORDS.has(word);
      else if (language === 'python') isKeyword = PY_KEYWORDS.has(word);
      else if (language === 'c' || language === 'cpp' || language === 'java') isKeyword = C_KEYWORDS.has(word);
      else if (language === 'sql') isKeyword = SQL_KEYWORDS.has(word);

      const isFunc = line[index] === '(';

      tokens.push({
        text: word,
        type: isKeyword ? 'keyword' : isFunc ? 'function' : 'plain',
      });
      continue;
    }

    // Operators & Symbols
    if (/[=+\-*/%&|^~!<>;:,.[\](){}]/.test(char)) {
      tokens.push({ text: char, type: 'operator' });
      index++;
      continue;
    }

    // Whitespace / default
    tokens.push({ text: char, type: 'plain' });
    index++;
  }

  return tokens;
}
