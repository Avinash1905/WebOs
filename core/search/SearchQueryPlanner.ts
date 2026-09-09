/**
 * @file SearchQueryPlanner.ts
 * @description Search AST query parser and execution planner (AND, OR, NOT clauses).
 */

export interface QueryASTNode {
  type: 'TERM' | 'AND' | 'OR' | 'NOT';
  term?: string;
  left?: QueryASTNode;
  right?: QueryASTNode;
  child?: QueryASTNode;
}

export class SearchQueryPlanner {
  public static parse(queryStr: string): QueryASTNode {
    const tokens = queryStr.trim().split(/\s+/);
    if (tokens.length === 0) return { type: 'TERM', term: '' };
    if (tokens.length === 1) return { type: 'TERM', term: tokens[0] };

    // Handle simple AND/OR
    if (tokens.includes('OR')) {
      const idx = tokens.indexOf('OR');
      const left = tokens.slice(0, idx).join(' ');
      const right = tokens.slice(idx + 1).join(' ');
      return {
        type: 'OR',
        left: this.parse(left),
        right: this.parse(right),
      };
    }

    if (tokens.includes('AND')) {
      const idx = tokens.indexOf('AND');
      const left = tokens.slice(0, idx).join(' ');
      const right = tokens.slice(idx + 1).join(' ');
      return {
        type: 'AND',
        left: this.parse(left),
        right: this.parse(right),
      };
    }

    return { type: 'TERM', term: queryStr };
  }
}
