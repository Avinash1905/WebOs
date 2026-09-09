import React, { useState } from 'react';
import './NetworkSnifferApp.css';

export interface Packet {
  id: number;
  time: string;
  source: string;
  destination: string;
  protocol: 'TCP' | 'UDP' | 'ICMP' | 'HTTP' | 'DNS' | 'MQTT';
  length: number;
  info: string;
}

export const NetworkSnifferApp: React.FC = () => {
  const [packets, setPackets] = useState<Packet[]>([
    { id: 1, time: '0.000000', source: '192.168.1.105', destination: '8.8.8.8', protocol: 'DNS', length: 74, info: 'Standard query 0x12a4 A webos.local' },
    { id: 2, time: '0.012490', source: '8.8.8.8', destination: '192.168.1.105', protocol: 'DNS', length: 90, info: 'Standard query response 0x12a4 A 10.0.0.1' },
    { id: 3, time: '0.015200', source: '192.168.1.105', destination: '10.0.0.1', protocol: 'TCP', length: 66, info: '54200 → 443 [SYN] Seq=0 Win=65535' },
    { id: 4, time: '0.024100', source: '10.0.0.1', destination: '192.168.1.105', protocol: 'TCP', length: 66, info: '443 → 54200 [SYN, ACK] Seq=0 Ack=1' },
    { id: 5, time: '0.024300', source: '192.168.1.105', destination: '10.0.0.1', protocol: 'TCP', length: 54, info: '54200 → 443 [ACK] Seq=1 Ack=1' },
    { id: 6, time: '0.029800', source: '192.168.1.105', destination: '10.0.0.1', protocol: 'HTTP', length: 280, info: 'GET /api/v1/health HTTP/1.1' },
  ]);
  const [selectedPacket, setSelectedPacket] = useState<Packet | null>(packets[0]);
  const [filter, setFilter] = useState('');

  const filteredPackets = packets.filter(
    (p) =>
      p.protocol.toLowerCase().includes(filter.toLowerCase()) ||
      p.source.includes(filter) ||
      p.destination.includes(filter) ||
      p.info.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="sniffer-app">
      <div className="sniffer-toolbar">
        <input
          placeholder="Apply display filter (e.g. tcp, http, 10.0.0.1)..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="sniffer-filter-input"
        />
        <button className="sniffer-btn" onClick={() => {
          const nextId = packets.length + 1;
          setPackets([...packets, {
            id: nextId,
            time: (nextId * 0.015).toFixed(6),
            source: '192.168.1.105',
            destination: '10.0.0.1',
            protocol: 'MQTT',
            length: 82,
            info: 'PUBLISH topic="webos/telemetry/cpu" qos=0 payload=48B'
          }]);
        }}>Capture Next</button>
      </div>

      <div className="sniffer-table-container">
        <table className="sniffer-table">
          <thead>
            <tr>
              <th>No.</th>
              <th>Time</th>
              <th>Source</th>
              <th>Destination</th>
              <th>Protocol</th>
              <th>Length</th>
              <th>Info</th>
            </tr>
          </thead>
          <tbody>
            {filteredPackets.map((p) => (
              <tr
                key={p.id}
                className={`sniffer-row ${selectedPacket?.id === p.id ? 'selected' : ''} proto-${p.protocol.toLowerCase()}`}
                onClick={() => setSelectedPacket(p)}
              >
                <td>{p.id}</td>
                <td>{p.time}</td>
                <td>{p.source}</td>
                <td>{p.destination}</td>
                <td><span className="proto-badge">{p.protocol}</span></td>
                <td>{p.length}</td>
                <td>{p.info}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedPacket && (
        <div className="sniffer-detail-pane">
          <div className="detail-header">Packet #{selectedPacket.id} Detail</div>
          <div className="detail-tree">
            <div>▸ Frame {selectedPacket.id}: {selectedPacket.length} bytes on wire</div>
            <div>▸ Ethernet II, Src: 52:54:00:12:34:56, Dst: 52:54:00:ab:cd:ef</div>
            <div>▸ Internet Protocol Version 4, Src: {selectedPacket.source}, Dst: {selectedPacket.destination}</div>
            <div>▸ Protocol: {selectedPacket.protocol}, Info: {selectedPacket.info}</div>
          </div>
        </div>
      )}
    </div>
  );
};
