/**
 * WebOS Volcano Query Execution Engine & Physical Iterator Pipeline
 */

export interface Tuple {
  [column: string]: any;
}

export interface VolcanoIterator {
  open(): Promise<void>;
  next(): Promise<Tuple | null>;
  close(): Promise<void>;
}

export class SeqScanIterator implements VolcanoIterator {
  private index = 0;
  constructor(private rows: Tuple[]) {}

  public async open(): Promise<void> { this.index = 0; }
  public async next(): Promise<Tuple | null> {
    if (this.index < this.rows.length) {
      return this.rows[this.index++];
    }
    return null;
  }
  public async close(): Promise<void> { this.index = this.rows.length; }
}

export class FilterIterator implements VolcanoIterator {
  constructor(private child: VolcanoIterator, private predicate: (t: Tuple) => boolean) {}

  public async open(): Promise<void> { await this.child.open(); }
  public async next(): Promise<Tuple | null> {
    let tuple: Tuple | null;
    while ((tuple = await this.child.next()) !== null) {
      if (this.predicate(tuple)) return tuple;
    }
    return null;
  }
  public async close(): Promise<void> { await this.child.close(); }
}

export class HashJoinIterator implements VolcanoIterator {
  private hashTable: Map<any, Tuple[]> = new Map();
  private currentMatches: Tuple[] = [];
  private rightTuple: Tuple | null = null;

  constructor(
    private leftChild: VolcanoIterator,
    private rightChild: VolcanoIterator,
    private leftKey: string,
    private rightKey: string
  ) {}

  public async open(): Promise<void> {
    await this.leftChild.open();
    await this.rightChild.open();

    let tuple: Tuple | null;
    while ((tuple = await this.leftChild.next()) !== null) {
      const keyVal = tuple[this.leftKey];
      if (!this.hashTable.has(keyVal)) this.hashTable.set(keyVal, []);
      this.hashTable.get(keyVal)!.push(tuple);
    }
  }

  public async next(): Promise<Tuple | null> {
    while (true) {
      if (this.currentMatches.length > 0) {
        const left = this.currentMatches.shift()!;
        return { ...left, ...this.rightTuple };
      }

      this.rightTuple = await this.rightChild.next();
      if (!this.rightTuple) return null;

      const rightKeyVal = this.rightTuple[this.rightKey];
      const matches = this.hashTable.get(rightKeyVal);
      if (matches && matches.length > 0) {
        this.currentMatches = [...matches];
      }
    }
  }

  public async close(): Promise<void> {
    await this.leftChild.close();
    await this.rightChild.close();
    this.hashTable.clear();
  }
}
