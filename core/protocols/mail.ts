/**
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
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
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
