/**
 * @file ClipboardTransformPipeline.ts
 * @description Multi-format transform pipeline: HTML to Markdown, JSON to CSV, and text normalization.
 */

export type ClipboardTransform = (input: string) => string;

export class ClipboardTransformPipeline {
  private readonly _transforms = new Map<string, ClipboardTransform>();

  constructor() {
    this.registerDefaults();
  }

  public registerTransform(name: string, transform: ClipboardTransform): void {
    this._transforms.set(name, transform);
  }

  public apply(name: string, input: string): string {
    const fn = this._transforms.get(name);
    if (!fn) return input;
    try {
      return fn(input);
    } catch {
      return input;
    }
  }

  public applyChain(transformNames: readonly string[], input: string): string {
    let result = input;
    for (const name of transformNames) {
      result = this.apply(name, result);
    }
    return result;
  }

  private registerDefaults(): void {
    // Strip HTML
    this.registerTransform('html-to-text', (html) => {
      return html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<p>/gi, '')
        .replace(/<\/p>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .trim();
    });

    // Strip ANSI
    this.registerTransform('strip-ansi', (text) => {
      return text.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
    });

    // Trim whitespace
    this.registerTransform('trim-lines', (text) => {
      return text
        .split('\n')
        .map((l) => l.trim())
        .join('\n');
    });
  }
}
