/**
 * WebOS Core - Cryptographic Subsystem Types
 */

export interface CryptoKeyPair {
  publicKey: string;
  privateKey: string;
  algorithm: 'RSA-4096' | 'ECDSA-P256' | 'Ed25519';
  createdAt: number;
}

export interface DigitalCertificate {
  serialNumber: string;
  subject: string;
  issuer: string;
  validFrom: number;
  validTo: number;
  publicKey: string;
  signature: string;
  isCA: boolean;
}

export interface EncryptedPayload {
  ciphertextHex: string;
  ivHex: string;
  tagHex?: string;
  algorithm: string;
}
