/**
 * WebOS Core - Shell AST Parser
 * Converts token streams into executable AST pipeline and command representations.
 */

import { Token, TokenType, ShellLexer } from './lexer';

export interface RedirectAST {
  type: 'out' | 'append' | 'in';
  target: string;
}

export interface CommandAST {
  name: string;
  args: string[];
  redirects: RedirectAST[];
}

export interface PipelineAST {
  commands: CommandAST[];
  isBackground: boolean;
}

export interface StatementAST {
  pipeline: PipelineAST;
  connector?: 'AND' | 'OR' | 'SEMI';
}

export class ShellParser {
  private tokens: Token[];
  private current: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  public static parse(input: string): StatementAST[] {
    const lexer = new ShellLexer(input);
    const tokens = lexer.tokenize();
    const parser = new ShellParser(tokens);
    return parser.parseStatements();
  }

  private peek(): Token {
    return this.tokens[this.current] || { type: 'EOF', value: '', position: 0 };
  }

  private advance(): Token {
    const tok = this.peek();
    if (tok.type !== 'EOF') {
      this.current++;
    }
    return tok;
  }

  private match(...types: TokenType[]): boolean {
    const tok = this.peek();
    if (types.includes(tok.type)) {
      this.advance();
      return true;
    }
    return false;
  }

  public parseStatements(): StatementAST[] {
    const statements: StatementAST[] = [];
    while (this.peek().type !== 'EOF') {
      const pipeline = this.parsePipeline();
      if (pipeline.commands.length === 0) break;

      let connector: 'AND' | 'OR' | 'SEMI' | undefined = undefined;
      if (this.match('AND_IF')) {
        connector = 'AND';
      } else if (this.match('OR_IF')) {
        connector = 'OR';
      } else if (this.match('SEMI')) {
        connector = 'SEMI';
      }

      statements.push({ pipeline, connector });
    }
    return statements;
  }

  private parsePipeline(): PipelineAST {
    const commands: CommandAST[] = [];
    let isBackground = false;

    while (this.peek().type !== 'EOF') {
      const cmd = this.parseCommand();
      if (cmd) {
        commands.push(cmd);
      }

      if (this.match('PIPE')) {
        continue;
      }

      if (this.match('AMP')) {
        isBackground = true;
        break;
      }

      if (['AND_IF', 'OR_IF', 'SEMI'].includes(this.peek().type)) {
        break;
      }

      break;
    }

    return { commands, isBackground };
  }

  private parseCommand(): CommandAST | null {
    const words: string[] = [];
    const redirects: RedirectAST[] = [];

    while (this.peek().type !== 'EOF') {
      const tok = this.peek();

      if (tok.type === 'WORD') {
        words.push(this.advance().value);
        continue;
      }

      if (tok.type === 'REDIRECT_OUT') {
        this.advance();
        const target = this.advance().value;
        redirects.push({ type: 'out', target });
        continue;
      }

      if (tok.type === 'REDIRECT_APP') {
        this.advance();
        const target = this.advance().value;
        redirects.push({ type: 'append', target });
        continue;
      }

      if (tok.type === 'REDIRECT_IN') {
        this.advance();
        const target = this.advance().value;
        redirects.push({ type: 'in', target });
        continue;
      }

      break;
    }

    if (words.length === 0) return null;

    return {
      name: words[0],
      args: words.slice(1),
      redirects,
    };
  }
}
