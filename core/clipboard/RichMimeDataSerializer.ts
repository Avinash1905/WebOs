/**
 * @file RichMimeDataSerializer.ts
 * @description Compound multi-part MIME payload serialization for rich clipboard exchange.
 */

export interface MimePayload {
  readonly mimeType: string;
  readonly content: string;
}

export class RichMimeDataSerializer {
  public static serialize(payloads: readonly MimePayload[]): string {
    return JSON.stringify(payloads);
  }

  public static deserialize(serialized: string): MimePayload[] {
    try {
      const parsed = JSON.parse(serialized);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}
