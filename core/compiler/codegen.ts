/**
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
