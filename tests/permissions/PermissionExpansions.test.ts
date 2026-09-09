import { describe, it, expect } from 'vitest';
import { AccessControlList, ABACPolicyEngine, AppSandboxTokenManager } from '../../core/permissions/index.js';

describe('Permissions Expansions', () => {
  describe('AccessControlList', () => {
    it('should evaluate user, group, and deny rules in priority order', () => {
      const acl = new AccessControlList();
      acl.addRule('GROUP', 'developers', ['READ', 'WRITE'], 'ALLOW');
      acl.addRule('USER', 'bob', ['READ', 'WRITE', 'EXECUTE'], 'ALLOW');
      acl.addRule('USER', 'malicious_user', ['READ', 'WRITE'], 'DENY');

      // bob allowed execute
      expect(acl.evaluate('bob', ['developers'], 'USER', 'EXECUTE').allowed).toBe(true);

      // dev allowed write
      expect(acl.evaluate('alice', ['developers'], 'USER', 'WRITE').allowed).toBe(true);

      // malicious_user explicitly denied even if in developers
      expect(acl.evaluate('malicious_user', ['developers'], 'USER', 'READ').allowed).toBe(false);
    });
  });

  describe('ABACPolicyEngine', () => {
    it('should evaluate contextual attributes and conditions', () => {
      const abac = new ABACPolicyEngine();
      abac.registerPolicy({
        policyId: 'CONFIDENTIAL_DOC_POLICY',
        name: 'Confidential Access',
        action: 'READ',
        condition: ({ subject, resource }) => {
          if (resource.classification === 'CONFIDENTIAL') {
            return (subject.clearanceLevel ?? 0) >= 3;
          }
          return true;
        }
      });

      const resLow = abac.evaluate(
        'READ',
        { userId: 'u1', role: 'USER', clearanceLevel: 1 },
        { path: '/top_secret.pdf', ownerId: 'root', classification: 'CONFIDENTIAL' }
      );
      expect(resLow.permitted).toBe(false);

      const resHigh = abac.evaluate(
        'READ',
        { userId: 'u2', role: 'USER', clearanceLevel: 4 },
        { path: '/top_secret.pdf', ownerId: 'root', classification: 'CONFIDENTIAL' }
      );
      expect(resHigh.permitted).toBe(true);
    });
  });

  describe('AppSandboxTokenManager', () => {
    it('should issue, validate and check path accessibility for scoped sandboxes', () => {
      const tokenMgr = new AppSandboxTokenManager();
      const token = tokenMgr.issueToken('text_editor', {
        readPaths: ['/home/alice/Documents'],
        writePaths: ['/home/alice/Documents/drafts', '/tmp'],
        allowedServices: ['storage', 'clipboard'],
        canForkProcess: false,
        canAccessNetwork: false
      });

      expect(tokenMgr.validateToken(token)).toBe(true);
      expect(tokenMgr.canAccessPath(token, '/home/alice/Documents/file.txt', 'read')).toBe(true);
      expect(tokenMgr.canAccessPath(token, '/etc/passwd', 'read')).toBe(false);
      expect(tokenMgr.canAccessPath(token, '/home/alice/Documents/drafts/test.txt', 'write')).toBe(true);
      expect(tokenMgr.canAccessPath(token, '/home/alice/Documents/readonly.txt', 'write')).toBe(false);
    });
  });
});
