/**
 * WebOS Core - Virtual DNS Resolver Subsystem
 */

import { DNSRecord } from './types';

export class DNSResolver {
  private static instance: DNSResolver;
  private hostsFile: Map<string, string> = new Map();
  private dnsCache: Map<string, DNSRecord> = new Map();

  private constructor() {
    this.initializeDefaultHosts();
  }

  public static getInstance(): DNSResolver {
    if (!DNSResolver.instance) {
      DNSResolver.instance = new DNSResolver();
    }
    return DNSResolver.instance;
  }

  private initializeDefaultHosts(): void {
    this.hostsFile.set('localhost', '127.0.0.1');
    this.hostsFile.set('webos.local', '127.0.0.1');
    this.hostsFile.set('api.webos.local', '127.0.0.1');
    this.hostsFile.set('router.local', '192.168.1.1');
    this.hostsFile.set('gateway', '192.168.1.1');
  }

  public setHostEntry(hostname: string, ipAddress: string): void {
    this.hostsFile.set(hostname.toLowerCase(), ipAddress);
  }

  public async resolve(hostname: string): Promise<string> {
    const norm = hostname.toLowerCase();

    // 1. Check local /etc/hosts mapping
    if (this.hostsFile.has(norm)) {
      return this.hostsFile.get(norm)!;
    }

    // 2. Check DNS cache
    const cached = this.dnsCache.get(norm);
    if (cached && cached.ttl > Date.now()) {
      return cached.ipAddress;
    }

    // 3. Simulated Upstream DNS lookup (e.g. 1.1.1.1 / 8.8.8.8)
    const simulatedIp = `172.217.${Math.floor(Math.random() * 200) + 1}.${Math.floor(Math.random() * 250) + 1}`;
    const record: DNSRecord = {
      hostname: norm,
      ipAddress: simulatedIp,
      ttl: Date.now() + 300 * 1000, // 5 min TTL
      recordType: 'A',
    };
    this.dnsCache.set(norm, record);
    return simulatedIp;
  }

  public getCache(): DNSRecord[] {
    return Array.from(this.dnsCache.values());
  }

  public flushCache(): void {
    this.dnsCache.clear();
  }
}

export const dnsResolver = DNSResolver.getInstance();
