/**
 * WebOS Column-Oriented Analytic Storage & Vectorized Query Engine
 */

export class ColumnarStore {
  private columns: Map<string, Array<string | number | boolean>> = new Map();
  private rowCount = 0;

  public createColumn(name: string): void {
    if (!this.columns.has(name)) {
      this.columns.set(name, []);
    }
  }

  public insertRow(row: Record<string, string | number | boolean>): void {
    for (const [key, val] of Object.entries(row)) {
      if (!this.columns.has(key)) {
        this.columns.set(key, []);
      }
      this.columns.get(key)!.push(val);
    }
    this.rowCount++;
  }

  public sumColumn(columnName: string): number {
    const col = this.columns.get(columnName);
    if (!col) return 0;
    let sum = 0;
    for (let i = 0; i < col.length; i++) {
      const v = col[i];
      if (typeof v === 'number') sum += v;
    }
    return sum;
  }

  public averageColumn(columnName: string): number {
    if (this.rowCount === 0) return 0;
    return this.sumColumn(columnName) / this.rowCount;
  }

  public getStats() {
    return {
      columns: Array.from(this.columns.keys()),
      rowCount: this.rowCount,
    };
  }
}

export const columnarStore = new ColumnarStore();
