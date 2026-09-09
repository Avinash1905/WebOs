/**
 * WebOS Core - Digital Certificates & PKI (Public Key Infrastructure)
 */

import { DigitalCertificate } from './types';
import { AsymmetricCrypto } from './keyPair';

export class CertificateAuthority {
  private static instance: CertificateAuthority;
  private trustedRootCAs: Map<string, DigitalCertificate> = new Map();
  private issuedCertificates: Map<string, DigitalCertificate> = new Map();

  private constructor() {
    this.initializeRootCA();
  }

  public static getInstance(): CertificateAuthority {
    if (!CertificateAuthority.instance) {
      CertificateAuthority.instance = new CertificateAuthority();
    }
    return CertificateAuthority.instance;
  }

  private async initializeRootCA(): Promise<void> {
    const rootCert: DigitalCertificate = {
      serialNumber: 'WEBOS-ROOT-CA-01',
      subject: 'CN=WebOS Root Certificate Authority, O=WebOS Systems, C=US',
      issuer: 'CN=WebOS Root Certificate Authority, O=WebOS Systems, C=US',
      validFrom: Date.now() - 365 * 86400000,
      validTo: Date.now() + 3650 * 86400000, // 10 years
      publicKey: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...',
      signature: 'VALID_ROOT_SIGNATURE_OK',
      isCA: true,
    };
    this.trustedRootCAs.set(rootCert.serialNumber, rootCert);
  }

  public async issueCertificate(
    subject: string,
    publicKey: string,
    caPrivateKey: string,
    validityDays: number = 365
  ): Promise<DigitalCertificate> {
    const serialNumber = `CERT-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const validFrom = Date.now();
    const validTo = validFrom + validityDays * 86400000;
    const issuer = 'CN=WebOS Root Certificate Authority, O=WebOS Systems, C=US';

    const certPayload = `${serialNumber}:${subject}:${issuer}:${validFrom}:${validTo}:${publicKey}`;
    const signature = await AsymmetricCrypto.sign(certPayload, caPrivateKey);

    const cert: DigitalCertificate = {
      serialNumber,
      subject,
      issuer,
      validFrom,
      validTo,
      publicKey,
      signature,
      isCA: false,
    };

    this.issuedCertificates.set(serialNumber, cert);
    return cert;
  }

  public async verifyCertificate(cert: DigitalCertificate): Promise<{ valid: boolean; reason?: string }> {
    const now = Date.now();
    if (now < cert.validFrom) return { valid: false, reason: 'Certificate is not yet valid' };
    if (now > cert.validTo) return { valid: false, reason: 'Certificate has expired' };

    const issuerCA = this.trustedRootCAs.get(cert.issuer) || Array.from(this.trustedRootCAs.values())[0];
    if (!issuerCA) return { valid: false, reason: 'Untrusted or unknown Certificate Authority' };

    const certPayload = `${cert.serialNumber}:${cert.subject}:${cert.issuer}:${cert.validFrom}:${cert.validTo}:${cert.publicKey}`;
    const isSigValid = await AsymmetricCrypto.verify(certPayload, cert.signature, issuerCA.publicKey);
    if (!isSigValid) return { valid: false, reason: 'Invalid cryptographic signature' };

    return { valid: true };
  }

  public getTrustedRoots(): DigitalCertificate[] {
    return Array.from(this.trustedRootCAs.values());
  }
}

export const certificateAuthority = CertificateAuthority.getInstance();
