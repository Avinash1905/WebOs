/**
 * WebOS Backend Enterprise - YATA / LWW Conflict-Free Replicated Data Types (CRDT)
 */

export interface CRDTCharItem {
  id: string; // client:clock
  client: string;
  clock: number;
  value: string;
  originLeft?: string;
  originRight?: string;
  deleted: boolean;
}

export class CollaborativeTextCRDT {
  public readonly docId: string;
  public readonly clientId: string;
  private clock: number = 0;
  private sequence: CRDTCharItem[] = [];

  constructor(docId: string, clientId: string) {
    this.docId = docId;
    this.clientId = clientId;
  }

  public insert(index: number, char: string): CRDTCharItem {
    this.clock++;
    const prevItem = index > 0 ? this.sequence[index - 1] : undefined;
    const nextItem = index < this.sequence.length ? this.sequence[index] : undefined;

    const item: CRDTCharItem = {
      id: `${this.clientId}:${this.clock}`,
      client: this.clientId,
      clock: this.clock,
      value: char,
      originLeft: prevItem?.id,
      originRight: nextItem?.id,
      deleted: false,
    };

    this.sequence.splice(index, 0, item);
    return item;
  }

  public delete(index: number): CRDTCharItem | null {
    if (index >= 0 && index < this.sequence.length) {
      const item = this.sequence[index];
      item.deleted = true;
      return item;
    }
    return null;
  }

  public mergeRemoteItem(remoteItem: CRDTCharItem): void {
    const existing = this.sequence.find((i) => i.id === remoteItem.id);
    if (existing) {
      if (remoteItem.deleted) existing.deleted = true;
      return;
    }

    // Insert according to originLeft and originRight
    let insertIdx = this.sequence.length;
    if (remoteItem.originLeft) {
      const leftIdx = this.sequence.findIndex((i) => i.id === remoteItem.originLeft);
      if (leftIdx !== -1) insertIdx = leftIdx + 1;
    } else {
      insertIdx = 0;
    }

    this.sequence.splice(insertIdx, 0, remoteItem);
  }

  public toString(): string {
    return this.sequence
      .filter((item) => !item.deleted)
      .map((item) => item.value)
      .join('');
  }
}
