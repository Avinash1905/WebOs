/**
 * WebOS Database - Type-Safe SQL Query Builder
 * Constructs parameterized PostgreSQL SELECT, INSERT, UPDATE, DELETE queries.
 */

export interface QueryClause {
  column: string;
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'ILIKE' | 'IN' | 'IS NULL' | 'IS NOT NULL';
  value?: any;
}

export class SQLQueryBuilder {
  private tableName: string;
  private operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' = 'SELECT';
  private selectedColumns: string[] = ['*'];
  private whereClauses: QueryClause[] = [];
  private insertData: Record<string, any> = {};
  private updateData: Record<string, any> = {};
  private orderByClause?: string;
  private limitCount?: number;
  private offsetCount?: number;

  constructor(table: string) {
    this.tableName = table;
  }

  public static table(table: string): SQLQueryBuilder {
    return new SQLQueryBuilder(table);
  }

  public select(...columns: string[]): this {
    this.operation = 'SELECT';
    this.selectedColumns = columns.length > 0 ? columns : ['*'];
    return this;
  }

  public insert(data: Record<string, any>): this {
    this.operation = 'INSERT';
    this.insertData = data;
    return this;
  }

  public update(data: Record<string, any>): this {
    this.operation = 'UPDATE';
    this.updateData = data;
    return this;
  }

  public delete(): this {
    this.operation = 'DELETE';
    return this;
  }

  public where(column: string, operator: QueryClause['operator'], value?: any): this {
    this.whereClauses.push({ column, operator, value });
    return this;
  }

  public orderBy(column: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
    this.orderByClause = `${column} ${direction}`;
    return this;
  }

  public limit(count: number): this {
    this.limitCount = count;
    return this;
  }

  public offset(count: number): this {
    this.offsetCount = count;
    return this;
  }

  public toSQL(): { sql: string; values: any[] } {
    const values: any[] = [];
    let paramIndex = 1;

    let sql = '';

    if (this.operation === 'SELECT') {
      sql = `SELECT ${this.selectedColumns.join(', ')} FROM ${this.tableName}`;
      if (this.whereClauses.length > 0) {
        const whereParts = this.whereClauses.map((clause) => {
          if (clause.operator === 'IS NULL' || clause.operator === 'IS NOT NULL') {
            return `${clause.column} ${clause.operator}`;
          }
          values.push(clause.value);
          return `${clause.column} ${clause.operator} $${paramIndex++}`;
        });
        sql += ` WHERE ${whereParts.join(' AND ')}`;
      }
      if (this.orderByClause) {
        sql += ` ORDER BY ${this.orderByClause}`;
      }
      if (this.limitCount !== undefined) {
        sql += ` LIMIT ${this.limitCount}`;
      }
      if (this.offsetCount !== undefined) {
        sql += ` OFFSET ${this.offsetCount}`;
      }
    } else if (this.operation === 'INSERT') {
      const keys = Object.keys(this.insertData);
      const valPlaceholders = keys.map(() => `$${paramIndex++}`);
      values.push(...Object.values(this.insertData));
      sql = `INSERT INTO ${this.tableName} (${keys.join(', ')}) VALUES (${valPlaceholders.join(', ')}) RETURNING *`;
    } else if (this.operation === 'UPDATE') {
      const setParts = Object.entries(this.updateData).map(([k, v]) => {
        values.push(v);
        return `${k} = $${paramIndex++}`;
      });
      sql = `UPDATE ${this.tableName} SET ${setParts.join(', ')}`;
      if (this.whereClauses.length > 0) {
        const whereParts = this.whereClauses.map((clause) => {
          values.push(clause.value);
          return `${clause.column} ${clause.operator} $${paramIndex++}`;
        });
        sql += ` WHERE ${whereParts.join(' AND ')}`;
      }
      sql += ' RETURNING *';
    } else if (this.operation === 'DELETE') {
      sql = `DELETE FROM ${this.tableName}`;
      if (this.whereClauses.length > 0) {
        const whereParts = this.whereClauses.map((clause) => {
          values.push(clause.value);
          return `${clause.column} ${clause.operator} $${paramIndex++}`;
        });
        sql += ` WHERE ${whereParts.join(' AND ')}`;
      }
    }

    return { sql: sql + ';', values };
  }
}
