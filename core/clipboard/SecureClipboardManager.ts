/**
 * @file SecureClipboardManager.ts
 * @description Sensitive data classification and auto-clear timer for passwords and tokens.
 */

export class SecureClipboardManager {
  private autoClearTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly sensitivePatterns = [
    /password/i,
    /bearer\s+[a-zA-Z0-9._-]+/i,
    /api[_-]?key/i,
    /secret/i,
    /ghp_[a-zA-Z0-9]{36}/
  ];

  public isSensitive(content: string): boolean {
    return this.sensitivePatterns.some(pattern => pattern.test(content));
  }

  public scheduleAutoClear(clearCallback: () => void, timeoutMs = 30000): void {
    if (this.autoClearTimer) {
      clearTimeout(this.autoClearTimer);
    }
    this.autoClearTimer = setTimeout(() => {
      clearCallback();
      this.autoClearTimer = null;
    }, timeoutMs);
  }

  public cancelAutoClear(): void {
    if (this.autoClearTimer) {
      clearTimeout(this.autoClearTimer);
      this.autoClearTimer = null;
    }
  }
}
