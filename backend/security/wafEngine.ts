/**
 * WebOS Web Application Firewall (WAF) & OWASP Rule Evaluation Engine
 */

export interface WAFInspectionResult {
  blocked: boolean;
  threatRuleId?: string;
  reason?: string;
  clientIp: string;
}

export class WAFEngine {
  private sqliPattern = new RegExp('(\\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC|WHERE)\\b.*(--|\\bOR\\b|\\bAND\\b))', 'i');
  private xssPattern = new RegExp('<script|javascript:|onerror|onload', 'i');
  private rcePattern = new RegExp('(\\b(cat|chmod|chown|wget|curl|nc|bash|sh|powershell|cmd)\\b)', 'i');

  public inspectRequest(clientIp: string, path: string, body?: string, headers?: Record<string, string>): WAFInspectionResult {
    const targetString = `${path} ${body || ''} ${JSON.stringify(headers || {})}`;

    if (this.sqliPattern.test(targetString)) {
      return { blocked: true, threatRuleId: 'OWASP-CRS-942100', reason: 'SQL Injection attempt detected', clientIp };
    }
    if (this.xssPattern.test(targetString)) {
      return { blocked: true, threatRuleId: 'OWASP-CRS-941100', reason: 'Cross-Site Scripting (XSS) attempt detected', clientIp };
    }
    if (this.rcePattern.test(targetString)) {
      return { blocked: true, threatRuleId: 'OWASP-CRS-932100', reason: 'Remote Command Execution (RCE) attempt detected', clientIp };
    }

    return { blocked: false, clientIp };
  }
}

export const wafEngine = new WAFEngine();
