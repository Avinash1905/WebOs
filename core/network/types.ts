/**
 * WebOS Core - Virtual Network Stack Types
 */

export interface NetworkInterfaceConfig {
  name: string;
  macAddress: string;
  ipAddress: string;
  subnetMask: string;
  gateway: string;
  dnsServers: string[];
  isUp: boolean;
  rxBytes: number;
  txBytes: number;
  rxPackets: number;
  txPackets: number;
}

export type TCPState =
  | 'CLOSED'
  | 'LISTEN'
  | 'SYN_SENT'
  | 'SYN_RECEIVED'
  | 'ESTABLISHED'
  | 'FIN_WAIT_1'
  | 'FIN_WAIT_2'
  | 'CLOSE_WAIT'
  | 'CLOSING'
  | 'LAST_ACK'
  | 'TIME_WAIT';

export interface RouteEntry {
  destination: string;
  genmask: string;
  gateway: string;
  interfaceName: string;
  metric: number;
}

export interface DNSRecord {
  hostname: string;
  ipAddress: string;
  ttl: number;
  recordType: 'A' | 'AAAA' | 'CNAME' | 'TXT';
}
