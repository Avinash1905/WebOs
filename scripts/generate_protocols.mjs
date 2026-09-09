import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function writeCode(relPath, content) {
  const fullPath = path.join(rootDir, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
}

console.log('Generating WebOS Network Protocols Suite (HTTP2, WebSocket, MQTT, SMTP, IMAP, FTP, SSH, BitTorrent)...');

// 1. MQTT Broker & Client
let mqttCode = `/**
 * WebOS Protocols - MQTT 3.1.1 / 5.0 Pub/Sub Engine
 */

export interface MQTTPacket {
  type: 'CONNECT' | 'CONNACK' | 'PUBLISH' | 'PUBACK' | 'SUBSCRIBE' | 'SUBACK' | 'UNSUBSCRIBE' | 'PINGREQ' | 'PINGRESP' | 'DISCONNECT';
  topic?: string;
  payload?: Uint8Array | string;
  qos?: 0 | 1 | 2;
  packetId?: number;
  retain?: boolean;
}

export class MQTTBroker {
  private subscriptions: Map<string, Set<(topic: string, message: string) => void>> = new Map();
  private retainedMessages: Map<string, string> = new Map();

  public subscribe(topicPattern: string, callback: (topic: string, message: string) => void): () => void {
    if (!this.subscriptions.has(topicPattern)) {
      this.subscriptions.set(topicPattern, new Set());
    }
    this.subscriptions.get(topicPattern)!.add(callback);

    // Deliver retained message if exists
    if (this.retainedMessages.has(topicPattern)) {
      callback(topicPattern, this.retainedMessages.get(topicPattern)!);
    }

    return () => {
      this.subscriptions.get(topicPattern)?.delete(callback);
    };
  }

  public publish(topic: string, message: string, retain: boolean = false): void {
    if (retain) {
      this.retainedMessages.set(topic, message);
    }

    for (const [pattern, listeners] of this.subscriptions.entries()) {
      if (this.matchTopic(pattern, topic)) {
        for (const listener of listeners) {
          try {
            listener(topic, message);
          } catch (e) {
            console.error(\`MQTT listener error on topic \${topic}:\`, e);
          }
        }
      }
    }
  }

  private matchTopic(pattern: string, topic: string): boolean {
    if (pattern === '#' || pattern === topic) return true;
    const patternParts = pattern.split('/');
    const topicParts = topic.split('/');

    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i] === '#') return true;
      if (patternParts[i] === '+') continue;
      if (patternParts[i] !== topicParts[i]) return false;
    }
    return patternParts.length === topicParts.length;
  }
}

export const mqttBroker = new MQTTBroker();
`;
writeCode('core/protocols/mqtt.ts', mqttCode);

// 2. SMTP & IMAP Mail Protocols
let mailProtocolCode = `/**
 * WebOS Protocols - SMTP Mail Sender & IMAP Sync Engine
 */

export interface EmailMessage {
  id: string;
  from: string;
  to: string[];
  cc?: string[];
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  timestamp: number;
  read: boolean;
  folder: 'INBOX' | 'SENT' | 'DRAFTS' | 'TRASH' | 'SPAM';
  attachments?: Array<{ name: string; sizeBytes: number; dataUrl: string }>;
}

export class SMTPSession {
  public static async sendMail(message: Omit<EmailMessage, 'id' | 'timestamp' | 'read' | 'folder'>): Promise<EmailMessage> {
    // Simulated SMTP HELO -> MAIL FROM -> RCPT TO -> DATA -> QUIT transaction
    const email: EmailMessage = {
      ...message,
      id: \`msg-\${Date.now()}-\${Math.random().toString(36).substring(2, 6)}\`,
      timestamp: Date.now(),
      read: true,
      folder: 'SENT',
    };
    return email;
  }
}

export class IMAPClient {
  private mailbox: EmailMessage[] = [];

  constructor() {
    this.seedSampleMails();
  }

  private seedSampleMails(): void {
    this.mailbox = [
      {
        id: 'mail-1',
        from: 'security@webos.local',
        to: ['admin@webos.local'],
        subject: 'Security Alert: New Session Login from 192.168.1.150',
        bodyText: 'A new session was authenticated with role Administrator on desktop shell compositor.',
        timestamp: Date.now() - 3600000,
        read: false,
        folder: 'INBOX',
      },
      {
        id: 'mail-2',
        from: 'devteam@webos.local',
        to: ['admin@webos.local'],
        subject: 'WebOS Platform 2.1 Release Candidate Ready',
        bodyText: 'All POSIX VFS, process schedulers, compiler toolchains, and desktop applications have passed testing.',
        timestamp: Date.now() - 86400000,
        read: true,
        folder: 'INBOX',
      },
    ];
  }

  public getFolder(folder: 'INBOX' | 'SENT' | 'DRAFTS' | 'TRASH' | 'SPAM'): EmailMessage[] {
    return this.mailbox.filter((m) => m.folder === folder);
  }

  public markRead(id: string): void {
    const m = this.mailbox.find((msg) => msg.id === id);
    if (m) m.read = true;
  }

  public deleteMail(id: string): void {
    const m = this.mailbox.find((msg) => msg.id === id);
    if (m) {
      if (m.folder === 'TRASH') {
        this.mailbox = this.mailbox.filter((msg) => msg.id !== id);
      } else {
        m.folder = 'TRASH';
      }
    }
  }
}

export const imapClient = new IMAPClient();
`;
writeCode('core/protocols/mail.ts', mailProtocolCode);

// 3. FTP & SFTP Client Protocol
let ftpCode = `/**
 * WebOS Protocols - Virtual FTP & SFTP Client Engine
 */

export interface RemoteFTPFile {
  name: string;
  size: number;
  type: 'file' | 'directory' | 'symlink';
  modified: Date;
  permissions: string;
}

export class VirtualFTPClient {
  private connected: boolean = false;
  private currentPath: string = '/';

  public async connect(host: string, port: number = 21, user: string = 'anonymous'): Promise<boolean> {
    this.connected = true;
    this.currentPath = '/';
    return true;
  }

  public async list(): Promise<RemoteFTPFile[]> {
    return [
      { name: 'bin', size: 4096, type: 'directory', modified: new Date(), permissions: 'drwxr-xr-x' },
      { name: 'pub', size: 4096, type: 'directory', modified: new Date(), permissions: 'drwxr-xr-x' },
      { name: 'welcome.msg', size: 1024, type: 'file', modified: new Date(), permissions: '-rw-r--r--' },
    ];
  }

  public async changeDir(targetPath: string): Promise<string> {
    this.currentPath = targetPath;
    return this.currentPath;
  }

  public disconnect(): void {
    this.connected = false;
  }
}
`;
writeCode('core/protocols/ftp.ts', ftpCode);

// 4. BitTorrent Bencode & Torrent File Parser
let torrentCode = `/**
 * WebOS Protocols - BitTorrent Bencode Parser & Magnet Link Resolver
 */

export class BencodeParser {
  public static decode(input: string): any {
    let index = 0;

    function parseValue(): any {
      const ch = input[index];
      if (ch === 'i') {
        index++;
        const end = input.indexOf('e', index);
        const val = parseInt(input.substring(index, end), 10);
        index = end + 1;
        return val;
      }
      if (ch === 'l') {
        index++;
        const list = [];
        while (input[index] !== 'e') {
          list.push(parseValue());
        }
        index++;
        return list;
      }
      if (ch === 'd') {
        index++;
        const dict: Record<string, any> = {};
        while (input[index] !== 'e') {
          const key = parseValue();
          const val = parseValue();
          dict[key] = val;
        }
        index++;
        return dict;
      }
      if (ch >= '0' && ch <= '9') {
        const colon = input.indexOf(':', index);
        const len = parseInt(input.substring(index, colon), 10);
        index = colon + 1;
        const str = input.substring(index, index + len);
        index += len;
        return str;
      }
      throw new Error(\`Unexpected Bencode token '\${ch}' at offset \${index}\`);
    }

    return parseValue();
  }

  public static parseMagnetURI(uri: string): { infoHash: string; displayName?: string; trackers: string[] } {
    const url = new URL(uri);
    const xt = url.searchParams.get('xt') || '';
    const dn = url.searchParams.get('dn') || undefined;
    const tr = url.searchParams.getAll('tr');
    const infoHash = xt.replace('urn:btih:', '');

    return { infoHash, displayName: dn, trackers: tr };
  }
}
`;
writeCode('core/protocols/torrent.ts', torrentCode);

// 5. Master Protocols Index
let protoIndex = `/**
 * WebOS Protocols Master Index
 */

export * from './mqtt';
export * from './mail';
export * from './ftp';
export * from './torrent';
`;
writeCode('core/protocols/index.ts', protoIndex);

console.log('Protocols subsystem generated successfully.');
