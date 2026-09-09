/**
 * @file AccessControlList.ts
 * @description Fine-grained POSIX & Extended ACL (Access Control List) rule evaluator.
 */

import type { PermissionType } from './types.js';

export type ACLPrincipalType = 'USER' | 'GROUP' | 'ROLE' | 'EVERYONE';
export type ACLRuleEffect = 'ALLOW' | 'DENY';

export interface ACLEntry {
  readonly id: string;
  readonly principalType: ACLPrincipalType;
  readonly principalId: string; // userId, groupId, roleName, or '*'
  readonly permissions: readonly PermissionType[];
  readonly effect: ACLRuleEffect;
  readonly isInherited?: boolean;
}

export class AccessControlList {
  private readonly entries: ACLEntry[] = [];

  constructor(initialEntries?: readonly ACLEntry[]) {
    if (initialEntries) {
      this.entries.push(...initialEntries);
    }
  }

  public addRule(
    principalType: ACLPrincipalType,
    principalId: string,
    permissions: PermissionType[],
    effect: ACLRuleEffect = 'ALLOW',
    isInherited = false
  ): ACLEntry {
    const entry: ACLEntry = {
      id: `acl_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      principalType,
      principalId,
      permissions: Object.freeze([...permissions]),
      effect,
      isInherited
    };
    this.entries.push(entry);
    return entry;
  }

  public removeRule(ruleId: string): boolean {
    const idx = this.entries.findIndex(e => e.id === ruleId);
    if (idx !== -1) {
      this.entries.splice(idx, 1);
      return true;
    }
    return false;
  }

  public evaluate(
    userId: string,
    groups: string[],
    role: string,
    requestedPerm: PermissionType
  ): { allowed: boolean; matchedRule?: ACLEntry } {
    // 1. Explicit DENY rules take immediate precedence
    for (const rule of this.entries) {
      if (rule.effect === 'DENY' && this.matchesPrincipal(rule, userId, groups, role)) {
        if (rule.permissions.includes(requestedPerm)) {
          return { allowed: false, matchedRule: rule };
        }
      }
    }

    // 2. Direct USER ALLOW rules
    for (const rule of this.entries) {
      if (rule.effect === 'ALLOW' && rule.principalType === 'USER' && rule.principalId === userId) {
        if (rule.permissions.includes(requestedPerm)) {
          return { allowed: true, matchedRule: rule };
        }
      }
    }

    // 3. GROUP or ROLE ALLOW rules
    for (const rule of this.entries) {
      if (rule.effect === 'ALLOW' && (rule.principalType === 'GROUP' || rule.principalType === 'ROLE')) {
        if (this.matchesPrincipal(rule, userId, groups, role)) {
          if (rule.permissions.includes(requestedPerm)) {
            return { allowed: true, matchedRule: rule };
          }
        }
      }
    }

    // 4. EVERYONE ALLOW rules
    for (const rule of this.entries) {
      if (rule.effect === 'ALLOW' && rule.principalType === 'EVERYONE') {
        if (rule.permissions.includes(requestedPerm)) {
          return { allowed: true, matchedRule: rule };
        }
      }
    }

    // Default deny
    return { allowed: false };
  }

  private matchesPrincipal(rule: ACLEntry, userId: string, groups: string[], role: string): boolean {
    switch (rule.principalType) {
      case 'USER':
        return rule.principalId === userId;
      case 'GROUP':
        return groups.includes(rule.principalId);
      case 'ROLE':
        return rule.principalId === role || rule.principalId === '*';
      case 'EVERYONE':
        return true;
      default:
        return false;
    }
  }

  public getRules(): readonly ACLEntry[] {
    return Object.freeze([...this.entries]);
  }
}
