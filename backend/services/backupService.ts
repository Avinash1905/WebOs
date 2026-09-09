/**
 * WebOS Backend - Cloud Disaster Recovery & Backup Snapshot Service
 */

import { vfs } from '../../core/vfs/vfs';
import { SymmetricCrypto } from '../../core/crypto/aes';

export interface BackupSnapshot {
  id: string;
  name: string;
  createdAt: number;
  sizeBytes: number;
  encrypted: boolean;
  totalFiles: number;
  payload: string; // Base64 or encrypted JSON payload
}

export class BackupService {
  private static instance: BackupService;
  private snapshots: Map<string, BackupSnapshot> = new Map();

  private constructor() {
    this.seedInitialSnapshot();
  }

  public static getInstance(): BackupService {
    if (!BackupService.instance) {
      BackupService.instance = new BackupService();
    }
    return BackupService.instance;
  }

  private seedInitialSnapshot(): void {
    const id = 'snap-system-initial';
    this.snapshots.set(id, {
      id,
      name: 'Factory Default OS Image',
      createdAt: Date.now() - 86400000 * 7,
      sizeBytes: 1048576,
      encrypted: false,
      totalFiles: 34,
      payload: JSON.stringify({ version: '2.1.0', files: [] }),
    });
  }

  public async createBackup(name: string, encryptionKey?: string): Promise<BackupSnapshot> {
    const filesToBackup: Array<{ path: string; content: string }> = [];

    // Collect home directory files
    const collectDir = (dirPath: string) => {
      try {
        if (!vfs.exists(dirPath)) return;
        const entries = vfs.readdir(dirPath);
        for (const entry of entries) {
          if (entry.type === 'directory') {
            collectDir(entry.path);
          } else if (entry.type === 'file') {
            const content = vfs.readFile(entry.path, 'utf-8') as string;
            filesToBackup.push({ path: entry.path, content });
          }
        }
      } catch (e) {
        console.error(`Error reading ${dirPath} for backup:`, e);
      }
    };

    collectDir('/home');
    collectDir('/etc');

    let payloadString = JSON.stringify({
      version: '2.1.0',
      timestamp: Date.now(),
      files: filesToBackup,
    });

    let isEncrypted = false;
    if (encryptionKey) {
      const encrypted = await SymmetricCrypto.encrypt(payloadString, encryptionKey);
      payloadString = JSON.stringify(encrypted);
      isEncrypted = true;
    }

    const id = `snap-${Date.now()}`;
    const snapshot: BackupSnapshot = {
      id,
      name,
      createdAt: Date.now(),
      sizeBytes: payloadString.length,
      encrypted: isEncrypted,
      totalFiles: filesToBackup.length,
      payload: payloadString,
    };

    this.snapshots.set(id, snapshot);
    return snapshot;
  }

  public async restoreBackup(snapshotId: string, encryptionKey?: string): Promise<boolean> {
    const snapshot = this.snapshots.get(snapshotId);
    if (!snapshot) throw new Error(`E404: Snapshot '${snapshotId}' not found`);

    let rawJson = snapshot.payload;
    if (snapshot.encrypted) {
      if (!encryptionKey) throw new Error('EKEYREQ: Encryption key required to restore encrypted snapshot');
      const payloadObj = JSON.parse(snapshot.payload);
      rawJson = await SymmetricCrypto.decrypt(payloadObj, encryptionKey);
    }

    const data = JSON.parse(rawJson);
    if (data.files && Array.isArray(data.files)) {
      for (const item of data.files) {
        const parent = item.path.substring(0, item.path.lastIndexOf('/'));
        if (parent && !vfs.exists(parent)) {
          vfs.mkdirp(parent);
        }
        vfs.writeFile(item.path, item.content);
      }
    }

    return true;
  }

  public listSnapshots(): BackupSnapshot[] {
    return Array.from(this.snapshots.values());
  }

  public deleteSnapshot(id: string): boolean {
    return this.snapshots.delete(id);
  }
}

export const backupService = BackupService.getInstance();
