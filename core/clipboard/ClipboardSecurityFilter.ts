/**
 * @file ClipboardSecurityFilter.ts
 * @description Sensitive credential pattern scrubbing and clipboard security governor.
 */

export interface RedactionResult {
  readonly sanitized: string;
  readonly detectedSensitiveTypes: string[];
  readonly wasRedacted: boolean;
}

export class ClipboardSecurityFilter {
  public static sanitize(text: string): RedactionResult {
    let sanitized = text;
    const detected: string[] = [];

    const privKeyRegex = /-----BEGIN (?:RSA )?PRIVATE KEY-----/gi;
    const apiKeyRegex = /(?:api[_-]?key|secret|token)[\s:=]+['"]?([a-zA-Z0-9_-]{16,})['"]?/gi;
    const passwordRegex = /(?:password|passwd)[\s:=]+['"]?([^\s'"]{6,})['"]?/gi;

    if (privKeyRegex.test(text)) {
      detected.push('PRIVATE_KEY');
      sanitized = sanitized.replace(privKeyRegex, '[REDACTED_PRIVATE_KEY]');
    }

    if (apiKeyRegex.test(text)) {
      detected.push('API_KEY');
      sanitized = sanitized.replace(apiKeyRegex, 'api_key=[REDACTED]');
    }

    if (passwordRegex.test(text)) {
      detected.push('PASSWORD');
      sanitized = sanitized.replace(passwordRegex, 'password=[REDACTED]');
    }

    return {
      sanitized,
      detectedSensitiveTypes: detected,
      wasRedacted: detected.length > 0,
    };
  }
}
