/**
 * @file BiometricCredentialStore.ts
 * @description WebAuthn / FIDO2 public key credential authenticator simulation.
 */

export interface Fido2Credential {
  readonly credentialId: string;
  readonly userId: string;
  readonly publicKey: string;
  signCount: number;
}

export class BiometricCredentialStore {
  private readonly _credentials = new Map<string, Fido2Credential>();

  public registerCredential(userId: string, publicKey: string): Fido2Credential {
    const credentialId = `fido2_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
    const cred: Fido2Credential = {
      credentialId,
      userId,
      publicKey,
      signCount: 0,
    };
    this._credentials.set(credentialId, cred);
    return cred;
  }

  public verifyChallenge(credentialId: string, _challenge: string): boolean {
    const cred = this._credentials.get(credentialId);
    if (!cred) return false;
    cred.signCount++;
    return true;
  }

  public getCredential(credentialId: string): Fido2Credential | undefined {
    return this._credentials.get(credentialId);
  }
}
