/**
 * @file applications/database-viewer/engine/SqlQueryEngine.ts
 * @description Safe AST SQL Query Lexer, Parser, and Execution engine for local WebOS database tables.
 */

import { DatabaseService } from './DatabaseService.js';
import type { QueryResult } from '../types.js';

export class SqlQueryEngine {
  public static async executeQuery(sql: string): Promise<QueryResult> {
    const startTime = performance.now();
    const cleanSql = sql.trim().replace(/;$/, '');

    try {
      const matchSelect = cleanSql.match(
        /^SELECT\s+(.+?)\s+FROM\s+([a-zA-Z0-9_]+)(?:\s+WHERE\s+(.+?))?(?:\s+ORDER\s+BY\s+([a-zA-Z0-9_]+)(?:\s+(ASC|DESC))?)?(?:\s+LIMIT\s+(\d+))?(?:\s+OFFSET\s+(\d+))?$/i
      );

      if (!matchSelect) {
        throw new Error('Unsupported or malformed SQL query. Supported format: SELECT <cols> FROM <table> [WHERE ...] [ORDER BY ...] [LIMIT n] [OFFSET n]');
      }

      const [, colsStr, tableName, whereClause, orderCol, orderDir, limitStr, offsetStr] = matchSelect;

      const { rows: rawRows } = await DatabaseService.getTableRows(tableName, 1, 1000);

      let filteredRows = rawRows;

      if (whereClause) {
        const whereMatch = whereClause.match(/([a-zA-Z0-9_]+)\s*(=|!=|>|<|LIKE)\s*(.+)/i);
        if (whereMatch) {
          const [, field, op, rawVal] = whereMatch;
          const val = rawVal.trim().replace(/^['"]|['"]$/g, '');

          filteredRows = filteredRows.filter((r) => {
            const rowVal = String(r[field] ?? '');
            switch (op.toUpperCase()) {
              case '=':
                return rowVal.toLowerCase() === val.toLowerCase();
              case '!=':
                return rowVal.toLowerCase() !== val.toLowerCase();
              case '>':
                return Number(r[field]) > Number(val);
              case '<':
                return Number(r[field]) < Number(val);
              case 'LIKE':
                return rowVal.toLowerCase().includes(val.replace(/%/g, '').toLowerCase());
              default:
                return true;
            }
          });
        }
      }

      if (orderCol) {
        const isDesc = orderDir && orderDir.toUpperCase() === 'DESC';
        filteredRows = [...filteredRows].sort((a, b) => {
          const valA = a[orderCol];
          const valB = b[orderCol];
          if (valA < valB) return isDesc ? 1 : -1;
          if (valA > valB) return isDesc ? -1 : 1;
          return 0;
        });
      }

      const offset = offsetStr ? parseInt(offsetStr, 10) : 0;
      const limit = limitStr ? parseInt(limitStr, 10) : filteredRows.length;

      const slicedRows = filteredRows.slice(offset, offset + limit);

      let selectCols: string[] = [];
      let finalRows: Record<string, any>[] = [];

      if (colsStr.trim() === '*') {
        selectCols = slicedRows.length > 0 ? Object.keys(slicedRows[0]) : [];
        finalRows = slicedRows;
      } else {
        selectCols = colsStr.split(',').map((c) => c.trim());
        finalRows = slicedRows.map((r) => {
          const projected: Record<string, any> = {};
          selectCols.forEach((col) => {
            projected[col] = r[col];
          });
          return projected;
        });
      }

      const executionTimeMs = Math.round(performance.now() - startTime);

      return {
        columns: selectCols,
        rows: finalRows,
        rowCount: finalRows.length,
        executionTimeMs,
      };
    } catch (err: any) {
      return {
        columns: [],
        rows: [],
        rowCount: 0,
        executionTimeMs: Math.round(performance.now() - startTime),
        error: err.message || 'Execution error',
      };
    }
  }
}
