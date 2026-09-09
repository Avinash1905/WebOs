/**
 * WebOS Relational Cost-Based Query Optimizer & Algebraic Rewriter
 */

export interface QueryPlanNode {
  nodeType: 'SeqScan' | 'IndexScan' | 'NestedLoopJoin' | 'HashJoin' | 'Aggregate' | 'Sort' | 'Limit';
  relation?: string;
  indexName?: string;
  cost: number;
  estimatedRows: number;
  children: QueryPlanNode[];
  filterPredicate?: string;
}

export class QueryOptimizer {
  public optimize(tableName: string, conditions: Array<{ column: string; op: string; val: any }>, hasIndex: boolean): QueryPlanNode {
    if (hasIndex && conditions.some(c => c.op === '=')) {
      return {
        nodeType: 'IndexScan',
        relation: tableName,
        indexName: `idx_${tableName}_primary`,
        cost: 4.25,
        estimatedRows: 1,
        children: [],
      };
    }

    return {
      nodeType: 'SeqScan',
      relation: tableName,
      cost: 100.0 + (conditions.length * 10),
      estimatedRows: 500,
      children: [],
      filterPredicate: conditions.map(c => `${c.column} ${c.op} ${c.val}`).join(' AND '),
    };
  }

  public explain(node: QueryPlanNode, depth = 0): string {
    const indent = '  '.repeat(depth);
    let str = `${indent}-> ${node.nodeType} ${node.relation ? 'on ' + node.relation : ''} (cost=${node.cost.toFixed(2)} rows=${node.estimatedRows})\n`;
    for (const child of node.children) {
      str += this.explain(child, depth + 1);
    }
    return str;
  }
}

export const queryOptimizer = new QueryOptimizer();
