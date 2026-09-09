/**
 * @file PAMAuthenticator.ts
 * @description Pluggable Authentication Modules (PAM) architecture for WebOS user validation.
 */

export type PAMControlFlag = 'REQUIRED' | 'REQUISITE' | 'SUFFICIENT' | 'OPTIONAL';
export type PAMFacility = 'AUTH' | 'ACCOUNT' | 'PASSWORD' | 'SESSION';

export interface PAMContext {
  readonly username: string;
  readonly credentials?: Record<string, unknown>;
  readonly clientIp?: string;
  readonly tty?: string;
  data: Map<string, unknown>;
}

export interface PAMModule {
  readonly name: string;
  authenticate?(ctx: PAMContext): Promise<boolean> | boolean;
  checkAccount?(ctx: PAMContext): Promise<boolean> | boolean;
  openSession?(ctx: PAMContext): Promise<boolean> | boolean;
  closeSession?(ctx: PAMContext): Promise<boolean> | boolean;
}

export interface PAMRule {
  readonly facility: PAMFacility;
  readonly control: PAMControlFlag;
  readonly module: PAMModule;
}

/**
 * Implements Linux-style Pluggable Authentication Modules (PAM) stack pipeline.
 */
export class PAMAuthenticator {
  private readonly _stack: PAMRule[] = [];

  /**
   * Registers a rule into the PAM configuration stack.
   */
  public addRule(facility: PAMFacility, control: PAMControlFlag, module: PAMModule): void {
    this._stack.push({ facility, control, module });
  }

  /**
   * Executes authentication pipeline for the given facility.
   */
  public async executeFacility(facility: PAMFacility, ctx: PAMContext): Promise<boolean> {
    const rules = this._stack.filter((r) => r.facility === facility);
    if (rules.length === 0) {
      return true; // Empty stack allows
    }

    let overallSuccess = true;

    for (const rule of rules) {
      let result = false;
      try {
        switch (facility) {
          case 'AUTH':
            result = rule.module.authenticate ? await rule.module.authenticate(ctx) : true;
            break;
          case 'ACCOUNT':
            result = rule.module.checkAccount ? await rule.module.checkAccount(ctx) : true;
            break;
          case 'SESSION':
            result = rule.module.openSession ? await rule.module.openSession(ctx) : true;
            break;
          default:
            result = true;
        }
      } catch {
        result = false;
      }

      if (rule.control === 'REQUISITE' && !result) {
        return false; // Immediate hard fail
      }

      if (rule.control === 'REQUIRED') {
        if (!result) overallSuccess = false;
      }

      if (rule.control === 'SUFFICIENT' && result && overallSuccess) {
        return true; // Immediate early pass
      }

      if (rule.control === 'OPTIONAL') {
        // Does not alter overall outcome on its own
      }
    }

    return overallSuccess;
  }
}
