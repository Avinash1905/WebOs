/**
 * @file ABACPolicyEngine.ts
 * @description Attribute-Based Access Control (ABAC) engine evaluating environmental, resource, and subject attributes.
 */

export interface ABACSubject {
  readonly userId: string;
  readonly role: string;
  readonly department?: string;
  readonly clearanceLevel?: number;
}

export interface ABACResource {
  readonly path: string;
  readonly ownerId: string;
  readonly classification?: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'SECRET';
  readonly tags?: readonly string[];
}

export interface ABACEnvironment {
  readonly timeOfDayHour?: number;
  readonly isInteractive?: boolean;
  readonly ipAddress?: string;
  readonly clientPlatform?: string;
}

export interface ABACPolicy {
  readonly policyId: string;
  readonly name: string;
  readonly action: string; // 'READ' | 'WRITE' | 'EXECUTE' | 'ADMIN'
  readonly condition: (ctx: { subject: ABACSubject; resource: ABACResource; env: ABACEnvironment }) => boolean;
}

export class ABACPolicyEngine {
  private readonly policies = new Map<string, ABACPolicy>();

  public registerPolicy(policy: ABACPolicy): void {
    this.policies.set(policy.policyId, policy);
  }

  public unregisterPolicy(policyId: string): boolean {
    return this.policies.delete(policyId);
  }

  public evaluate(
    action: string,
    subject: ABACSubject,
    resource: ABACResource,
    env: ABACEnvironment = {}
  ): { permitted: boolean; matchingPolicies: string[] } {
    // Admin role bypasses normal restrictions
    if (subject.role === 'ADMIN') {
      return { permitted: true, matchingPolicies: ['ADMIN_BYPASS'] };
    }

    const matched: string[] = [];
        for (const [id, policy] of this.policies.entries()) {
      if (policy.action === action || policy.action === '*') {
                try {
          if (policy.condition({ subject, resource, env })) {
            matched.push(id);
          }
        } catch {
          // Condition threw, treat as not matched
        }
      }
    }

    return {
      permitted: matched.length > 0,
      matchingPolicies: matched
    };
  }

  public getRegisteredPolicies(): readonly ABACPolicy[] {
    return Array.from(this.policies.values());
  }
}
