import { describe, expect, it } from 'vitest';
import {
  OAuth2OpenIdProvider,
  BiometricCredentialStore,
} from '../../core/users/index.js';

describe('OAuth2 and FIDO2 Authentication', () => {
  it('OAuth2OpenIdProvider issues auth codes and exchanges them for tokens', () => {
    const provider = new OAuth2OpenIdProvider();

    const code = provider.createAuthorizationCode('client_app_1', 'user_alice');
    expect(code).toContain('auth_code_');

    const tokens = provider.exchangeCodeForToken(code, 'client_app_1');
    expect(tokens?.accessToken).toBeDefined();
    expect(tokens?.idToken).toContain('jwt.');

    // Repeated exchange should fail (single-use authorization code)
    expect(provider.exchangeCodeForToken(code, 'client_app_1')).toBeNull();
  });

  it('BiometricCredentialStore registers FIDO2 public keys and verifies challenge response', () => {
    const store = new BiometricCredentialStore();

    const cred = store.registerCredential('user_bob', 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA');
    expect(cred.credentialId).toContain('fido2_');
    expect(cred.signCount).toBe(0);

    const verified = store.verifyChallenge(cred.credentialId, 'random_server_challenge_nonce');
    expect(verified).toBe(true);
    expect(store.getCredential(cred.credentialId)?.signCount).toBe(1);
  });
});
