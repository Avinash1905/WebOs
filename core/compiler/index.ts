/**
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
