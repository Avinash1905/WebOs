/**
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
          throw new Error(`Unknown opcode 0x${instruction.toString(16)} at IP ${this.ip - 1}`);
      }
    }

    return { output: this.outputLogs, result: this.stack.pop() };
  }
}
