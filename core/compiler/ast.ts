/**
 * WebOS Core Compiler Toolchain - Abstract Syntax Tree (AST) Definitions
 */

export interface BaseASTNode {
  line: number;
  column: number;
}

export interface ProgramNode extends BaseASTNode {
  type: 'Program';
  body: ASTNode[];
}

export interface TypeAnnotationNode extends BaseASTNode {
  type: 'TypeAnnotation';
  name: string;
  isPointer?: boolean;
  isArray?: boolean;
  arraySize?: number;
  generics?: TypeAnnotationNode[];
}

export interface ParameterNode extends BaseASTNode {
  type: 'Identifier';
  name: string;
  typeAnnotation: TypeAnnotationNode;
}

export interface FunctionDeclarationNode extends BaseASTNode {
  type: 'FunctionDeclaration';
  name: string;
  params: ParameterNode[];
  returnType: TypeAnnotationNode;
  body: BlockStatementNode;
  isAsync?: boolean;
  isPublic?: boolean;
}

export interface VariableDeclarationNode extends BaseASTNode {
  type: 'VariableDeclaration';
  name: string;
  isConst: boolean;
  typeAnnotation?: TypeAnnotationNode;
  initializer?: ASTNode;
}

export interface StructFieldNode extends BaseASTNode {
  type: 'Identifier';
  name: string;
  typeAnnotation: TypeAnnotationNode;
}

export interface StructDeclarationNode extends BaseASTNode {
  type: 'StructDeclaration';
  name: string;
  fields: StructFieldNode[];
}

export interface BlockStatementNode extends BaseASTNode {
  type: 'BlockStatement';
  statements: ASTNode[];
}

export interface IfStatementNode extends BaseASTNode {
  type: 'IfStatement';
  condition: ASTNode;
  consequent: BlockStatementNode;
  alternate?: BlockStatementNode | IfStatementNode;
}

export interface WhileStatementNode extends BaseASTNode {
  type: 'WhileStatement';
  condition: ASTNode;
  body: BlockStatementNode;
}

export interface ReturnStatementNode extends BaseASTNode {
  type: 'ReturnStatement';
  argument?: ASTNode;
}

export interface ExpressionStatementNode extends BaseASTNode {
  type: 'ExpressionStatement';
  expression: ASTNode;
}

export interface BinaryExpressionNode extends BaseASTNode {
  type: 'BinaryExpression';
  operator: string;
  left: ASTNode;
  right: ASTNode;
}

export interface UnaryExpressionNode extends BaseASTNode {
  type: 'UnaryExpression';
  operator: string;
  argument: ASTNode;
  isPrefix: boolean;
}

export interface CallExpressionNode extends BaseASTNode {
  type: 'CallExpression';
  callee: ASTNode;
  arguments: ASTNode[];
}

export interface IdentifierNode extends BaseASTNode {
  type: 'Identifier';
  name: string;
}

export interface LiteralNode extends BaseASTNode {
  type: 'Literal';
  value: any;
  raw: string;
  literalType: 'number' | 'string' | 'boolean' | 'null';
}

export type ASTNode =
  | ProgramNode
  | FunctionDeclarationNode
  | VariableDeclarationNode
  | StructDeclarationNode
  | StructFieldNode
  | ParameterNode
  | BlockStatementNode
  | IfStatementNode
  | WhileStatementNode
  | ReturnStatementNode
  | ExpressionStatementNode
  | BinaryExpressionNode
  | UnaryExpressionNode
  | CallExpressionNode
  | IdentifierNode
  | LiteralNode
  | TypeAnnotationNode;
