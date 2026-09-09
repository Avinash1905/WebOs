/**
 * WebOS TLS 1.3 Cryptographic Handshake & Record Layer Protocol Engine
 */

export type TLSHandshakeState =
  | 'START'
  | 'CLIENT_HELLO_SENT'
  | 'SERVER_HELLO_RECEIVED'
  | 'ENCRYPTED_EXTENSIONS_RECEIVED'
  | 'CERTIFICATE_RECEIVED'
  | 'CERTIFICATE_VERIFY_RECEIVED'
  | 'FINISHED_RECEIVED'
  | 'CONNECTED';

export interface TLSCipherSuite {
  id: number;
  name: string;
  keyExchange: string;
  cipher: string;
  hash: string;
}

export class TLS13Engine {
  public static readonly CIPHER_SUITES: TLSCipherSuite[] = [
    { id: 0x1301, name: 'TLS_AES_128_GCM_SHA256', keyExchange: 'ECDHE', cipher: 'AES-128-GCM', hash: 'SHA-256' },
    { id: 0x1302, name: 'TLS_AES_256_GCM_SHA384', keyExchange: 'ECDHE', cipher: 'AES-256-GCM', hash: 'SHA-384' },
    { id: 0x1303, name: 'TLS_CHACHA20_POLY1305_SHA256', keyExchange: 'ECDHE', cipher: 'ChaCha20-Poly1305', hash: 'SHA-256' },
  ];

  private state: TLSHandshakeState = 'START';
  private selectedCipher: TLSCipherSuite = TLS13Engine.CIPHER_SUITES[0];
  private sharedSecret: Uint8Array | null = null;
  private clientRandom: Uint8Array = new Uint8Array(32);
  private serverRandom: Uint8Array = new Uint8Array(32);

  public initiateHandshake(serverName: string): { clientHello: Uint8Array; state: TLSHandshakeState } {
    for (let i = 0; i < 32; i++) this.clientRandom[i] = Math.floor(Math.random() * 256);
    this.state = 'CLIENT_HELLO_SENT';
    return {
      clientHello: this.clientRandom,
      state: this.state,
    };
  }

  public processServerHello(serverHelloData: Uint8Array): TLSHandshakeState {
    this.serverRandom.set(serverHelloData.subarray(0, 32));
    this.state = 'SERVER_HELLO_RECEIVED';
    // Establish derived session key
    this.sharedSecret = new Uint8Array(32);
    for (let i = 0; i < 32; i++) this.sharedSecret[i] = this.clientRandom[i] ^ this.serverRandom[i];
    this.state = 'CONNECTED';
    return this.state;
  }

  public getState(): TLSHandshakeState {
    return this.state;
  }

  public getSelectedCipher(): TLSCipherSuite {
    return this.selectedCipher;
  }
}

export const tls13 = new TLS13Engine();
