/**
 * @file AstParser.ts
 * @description Abstract Syntax Tree (AST) parser for shell command lines.
 */

import { PosixLexer, type Token } from './PosixLexer.js';

export type ASTNodeType = 'COMMAND' | 'PIPELINE' | 'LOGICAL_OP' | 'SUBSHELL';

export interface ASTNode {
  readonly type: ASTNodeType;
}

export interface CommandASTNode extends ASTNode {
  readonly type: 'COMMAND';
  readonly name: string;
  readonly args: readonly string[];
  readonly redirectOut?: string;
  readonly redirectAppend?: string;
  readonly redirectIn?: string;
}

export interface PipelineASTNode extends ASTNode {
  readonly type: 'PIPELINE';
  readonly commands: readonly CommandASTNode[];
}

export interface LogicalOpASTNode extends ASTNode {
  readonly type: 'LOGICAL_OP';
  readonly op: 'AND' | 'OR' | 'SEQ';
  readonly left: ASTNode;
  readonly right: ASTNode;
}

export class AstParser {
  public static parse(commandLine: string): ASTNode {
    const tokens = PosixLexer.tokenize(commandLine);
    let index = 0;

    function current(): Token {
      return tokens[index] ?? { type: 'EOF', value: '', position: 0 };
    }

    function parseSimpleCommand(): CommandASTNode {
      const args: string[] = [];
      let redirectOut: string | undefined;
      let redirectAppend: string | undefined;
      let redirectIn: string | undefined;

      while (current().type !== 'EOF' && current().type !== 'PIPE' && current().type !== 'AND' && current().type !== 'OR' && current().type !== 'SEMICOLON') {
        const tok = current();
        if (tok.type === 'REDIRECT_OUT') {
          index++;
          redirectOut = current().value;
          index++;
        } else if (tok.type === 'REDIRECT_APPEND') {
          index++;
          redirectAppend = current().value;
          index++;
        } else if (tok.type === 'REDIRECT_IN') {
          index++;
          redirectIn = current().value;
          index++;
        } else if (tok.type === 'WORD') {
          args.push(tok.value);
          index++;
        } else {
          break;
        }
      }

      const name = args[0] ?? '';
      return {
        type: 'COMMAND',
        name,
        args: Object.freeze(args.slice(1)),
        redirectOut,
        redirectAppend,
        redirectIn
      };
    }

    function parsePipeline(): ASTNode {
      const first = parseSimpleCommand();
      if (current().type === 'PIPE') {
        const cmds: CommandASTNode[] = [first];
        while (current().type === 'PIPE') {
          index++; // skip '|'
          cmds.push(parseSimpleCommand());
        }
        return {
          type: 'PIPELINE',
          commands: Object.freeze(cmds)
        } as PipelineASTNode;
      }
      return first;
    }

    let left = parsePipeline();

    while (current().type === 'AND' || current().type === 'OR' || current().type === 'SEMICOLON') {
      const opToken = current();
      const op = opToken.type === 'AND' ? 'AND' : opToken.type === 'OR' ? 'OR' : 'SEQ';
      index++;
      const right = parsePipeline();
      left = {
        type: 'LOGICAL_OP',
        op,
        left,
        right
      } as LogicalOpASTNode;
    }

    return left;
  }
}
