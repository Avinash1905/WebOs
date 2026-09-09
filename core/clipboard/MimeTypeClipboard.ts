/**
 * @file MimeTypeClipboard.ts
 * @description Multi-representation MIME format clipboard data container.
 */

export interface ClipboardItemData {
  readonly formats: Readonly<Record<string, string | Uint8Array>>;
  readonly timestamp: number;
  readonly sourceAppId?: string;
}

export class MimeTypeClipboard {
  private currentItem: ClipboardItemData | null = null;

  public setItem(formats: Record<string, string | Uint8Array>, sourceAppId?: string): ClipboardItemData {
    const item: ClipboardItemData = {
      formats: Object.freeze({ ...formats }),
      timestamp: Date.now(),
      sourceAppId
    };
    this.currentItem = item;
    return item;
  }

  public getText(): string | undefined {
    if (!this.currentItem) return undefined;
    const text = this.currentItem.formats['text/plain'];
    return typeof text === 'string' ? text : undefined;
  }

  public getFormat(mimeType: string): string | Uint8Array | undefined {
    return this.currentItem?.formats[mimeType];
  }

  public getAvailableFormats(): readonly string[] {
    return this.currentItem ? Object.keys(this.currentItem.formats) : [];
  }

  public clear(): void {
    this.currentItem = null;
  }
}
