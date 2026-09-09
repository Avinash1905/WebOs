import fs from 'fs';
import path from 'path';

console.log('Generating Enhanced Desktop Applications...');

const appsDir = path.resolve(process.cwd(), 'applications');

function writeApp(dirName, tsxName, tsxCode, cssCode) {
  const targetDir = path.join(appsDir, dirName);
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(path.join(targetDir, tsxName), tsxCode);
  fs.writeFileSync(path.join(targetDir, tsxName.replace('.tsx', '.css')), cssCode);
}

// 1. RestClientApp
writeApp('rest-client', 'RestClientApp.tsx', `import React, { useState } from 'react';
import './RestClientApp.css';

export interface RestResponse {
  status: number;
  statusText: string;
  timeMs: number;
  sizeBytes: number;
  headers: Record<string, string>;
  body: string;
}

export const RestClientApp: React.FC = () => {
  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'>('GET');
  const [url, setUrl] = useState('https://api.webos.internal/v1/system/status');
  const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'body' | 'auth'>('params');
  const [bodyText, setBodyText] = useState('{\\n  "query": "system_diagnostics",\\n  "verbosity": "full"\\n}');
  const [response, setResponse] = useState<RestResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = () => {
    setIsLoading(true);
    const start = performance.now();
    setTimeout(() => {
      const elapsed = Math.round(performance.now() - start + 45);
      setResponse({
        status: 200,
        statusText: 'OK',
        timeMs: elapsed,
        sizeBytes: 1420,
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'x-webos-kernel': 'WebOS-6.0-Enterprise',
          'cache-control': 'no-cache, private',
        },
        body: JSON.stringify(
          {
            ok: true,
            status: 'online',
            vfsMounts: ['/bin', '/etc', '/home', '/var', '/dev'],
            activeUsers: 1,
            uptimeSeconds: 84200,
            loadAverage: [0.12, 0.08, 0.05],
          },
          null,
          2
        ),
      });
      setIsLoading(false);
    }, 150);
  };

  return (
    <div className="rest-client-app">
      <div className="rest-toolbar">
        <select value={method} onChange={(e) => setMethod(e.target.value as any)} className="method-select">
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
          <option value="PATCH">PATCH</option>
        </select>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://api.example.com/v1/resource"
          className="url-input"
        />
        <button onClick={handleSend} disabled={isLoading} className="send-btn">
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </div>

      <div className="rest-split-pane">
        <div className="rest-request-pane">
          <div className="rest-tabs">
            {(['params', 'headers', 'body', 'auth'] as const).map((t) => (
              <button
                key={t}
                className={\`rest-tab-btn \${activeTab === t ? 'active' : ''}\`}
                onClick={() => setActiveTab(t)}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="rest-tab-content">
            {activeTab === 'body' && (
              <textarea
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                className="body-editor"
              />
            )}
            {activeTab === 'params' && (
              <div className="key-value-editor">
                <div className="kv-row">
                  <input placeholder="Key" defaultValue="filter" />
                  <input placeholder="Value" defaultValue="active" />
                </div>
                <div className="kv-row">
                  <input placeholder="Key" defaultValue="limit" />
                  <input placeholder="Value" defaultValue="50" />
                </div>
              </div>
            )}
            {activeTab === 'headers' && (
              <div className="key-value-editor">
                <div className="kv-row">
                  <input placeholder="Header" defaultValue="Authorization" />
                  <input placeholder="Value" defaultValue="Bearer eyJhbGciOi..." />
                </div>
              </div>
            )}
            {activeTab === 'auth' && (
              <div className="auth-settings">
                <p>Auth Type: Bearer Token</p>
                <input placeholder="Token" defaultValue="webos_api_sec_token_9841" />
              </div>
            )}
          </div>
        </div>

        <div className="rest-response-pane">
          {response ? (
            <div className="response-container">
              <div className="response-status-bar">
                <span className="status-badge">Status: {response.status} {response.statusText}</span>
                <span className="meta-badge">{response.timeMs} ms</span>
                <span className="meta-badge">{response.sizeBytes} B</span>
              </div>
              <pre className="response-body-viewer">{response.body}</pre>
            </div>
          ) : (
            <div className="response-placeholder">Click 'Send' to dispatch HTTP/REST request.</div>
          )}
        </div>
      </div>
    </div>
  );
};
`, `.rest-client-app {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #1e1e24;
  color: #f1f1f1;
  font-family: 'Segoe UI', system-ui, sans-serif;
}
.rest-toolbar {
  display: flex;
  gap: 8px;
  padding: 10px;
  background: #282830;
  border-bottom: 1px solid #3a3a46;
}
.method-select {
  background: #383844;
  color: #61afef;
  font-weight: bold;
  border: 1px solid #4a4a58;
  padding: 6px 12px;
  border-radius: 4px;
}
.url-input {
  flex: 1;
  background: #18181c;
  color: #fff;
  border: 1px solid #3a3a46;
  padding: 6px 12px;
  border-radius: 4px;
}
.send-btn {
  background: #3b82f6;
  color: #fff;
  border: none;
  padding: 6px 18px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
}
.rest-split-pane {
  display: flex;
  flex: 1;
  overflow: hidden;
}
.rest-request-pane, .rest-response-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #3a3a46;
}
.rest-tabs {
  display: flex;
  background: #23232b;
  border-bottom: 1px solid #3a3a46;
}
.rest-tab-btn {
  background: transparent;
  border: none;
  color: #8b8b9e;
  padding: 8px 16px;
  cursor: pointer;
}
.rest-tab-btn.active {
  color: #61afef;
  border-bottom: 2px solid #61afef;
}
.rest-tab-content {
  flex: 1;
  padding: 10px;
  overflow: auto;
}
.body-editor {
  width: 100%;
  height: 100%;
  background: #18181c;
  color: #abb2bf;
  font-family: monospace;
  border: 1px solid #3a3a46;
  padding: 8px;
  border-radius: 4px;
  resize: none;
}
.key-value-editor .kv-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}
.key-value-editor input {
  flex: 1;
  background: #18181c;
  color: #fff;
  border: 1px solid #3a3a46;
  padding: 6px;
  border-radius: 4px;
}
.response-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.response-status-bar {
  display: flex;
  gap: 12px;
  padding: 8px 12px;
  background: #23232b;
  border-bottom: 1px solid #3a3a46;
  font-size: 13px;
}
.status-badge { color: #98c379; font-weight: bold; }
.meta-badge { color: #8b8b9e; }
.response-body-viewer {
  flex: 1;
  margin: 0;
  padding: 12px;
  background: #18181c;
  color: #98c379;
  overflow: auto;
  font-family: monospace;
  font-size: 13px;
}
.response-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
}
`);

// 2. HexEditorApp
writeApp('hex-editor', 'HexEditorApp.tsx', `import React, { useState } from 'react';
import './HexEditorApp.css';

export const HexEditorApp: React.FC = () => {
  const [data, setData] = useState<Uint8Array>(() => {
    const bytes = new Uint8Array(256);
    // Standard ELF header magic & bytes
    bytes[0] = 0x7f; bytes[1] = 0x45; bytes[2] = 0x4c; bytes[3] = 0x46; // .ELF
    bytes[4] = 0x02; // 64-bit
    bytes[5] = 0x01; // Little endian
    for (let i = 6; i < 256; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
    return bytes;
  });
  const [selectedOffset, setSelectedOffset] = useState<number | null>(0);

  const rows: number[][] = [];
  for (let i = 0; i < data.length; i += 16) {
    const row: number[] = [];
    for (let j = 0; j < 16 && i + j < data.length; j++) {
      row.push(data[i + j]);
    }
    rows.push(row);
  }

  const toHex = (n: number, pad = 2) => n.toString(16).toUpperCase().padStart(pad, '0');

  return (
    <div className="hex-editor-app">
      <div className="hex-toolbar">
        <span className="hex-file-title">binary_blob.elf (256 bytes)</span>
        <button className="hex-btn" onClick={() => {
          const fresh = new Uint8Array(256);
          for (let i = 0; i < 256; i++) fresh[i] = Math.floor(Math.random() * 256);
          setData(fresh);
        }}>Generate Random</button>
      </div>

      <div className="hex-view-container">
        <div className="hex-grid">
          {rows.map((row, rowIdx) => {
            const offset = rowIdx * 16;
            return (
              <div key={rowIdx} className="hex-row">
                <span className="hex-offset">{toHex(offset, 8)}</span>
                <div className="hex-bytes">
                  {row.map((b, bIdx) => {
                    const absOffset = offset + bIdx;
                    return (
                      <span
                        key={bIdx}
                        className={\`hex-byte \${selectedOffset === absOffset ? 'selected' : ''}\`}
                        onClick={() => setSelectedOffset(absOffset)}
                      >
                        {toHex(b)}
                      </span>
                    );
                  })}
                </div>
                <div className="hex-ascii">
                  {row.map((b, bIdx) => {
                    const char = b >= 32 && b <= 126 ? String.fromCharCode(b) : '.';
                    const absOffset = offset + bIdx;
                    return (
                      <span
                        key={bIdx}
                        className={\`hex-ascii-char \${selectedOffset === absOffset ? 'selected' : ''}\`}
                        onClick={() => setSelectedOffset(absOffset)}
                      >
                        {char}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="hex-status-bar">
        <span>Offset: {selectedOffset !== null ? \`0x\${toHex(selectedOffset, 4)} (\${selectedOffset})\` : 'None'}</span>
        <span>Byte: {selectedOffset !== null ? \`0x\${toHex(data[selectedOffset])} (\${data[selectedOffset]})\` : '-'}</span>
      </div>
    </div>
  );
};
`, `.hex-editor-app {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #141419;
  color: #d1d5db;
  font-family: 'Consolas', monospace;
}
.hex-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #1f2029;
  border-bottom: 1px solid #2d2f3d;
}
.hex-file-title { font-size: 13px; font-weight: bold; color: #60a5fa; }
.hex-btn {
  background: #374151;
  color: #fff;
  border: none;
  padding: 4px 10px;
  border-radius: 4px;
  cursor: pointer;
}
.hex-view-container {
  flex: 1;
  overflow: auto;
  padding: 12px;
}
.hex-row {
  display: flex;
  align-items: center;
  line-height: 22px;
  font-size: 13px;
}
.hex-offset {
  color: #9ca3af;
  margin-right: 16px;
  user-select: none;
}
.hex-bytes {
  display: flex;
  gap: 8px;
  margin-right: 24px;
}
.hex-byte {
  padding: 0 2px;
  cursor: pointer;
}
.hex-byte.selected {
  background: #3b82f6;
  color: #fff;
  border-radius: 2px;
}
.hex-ascii {
  display: flex;
  color: #10b981;
}
.hex-ascii-char {
  padding: 0 1px;
  cursor: pointer;
}
.hex-ascii-char.selected {
  background: #3b82f6;
  color: #fff;
}
.hex-status-bar {
  display: flex;
  gap: 20px;
  padding: 6px 12px;
  background: #1f2029;
  border-top: 1px solid #2d2f3d;
  font-size: 12px;
  color: #9ca3af;
}
`);

// 3. NetworkSnifferApp
writeApp('network-sniffer', 'NetworkSnifferApp.tsx', `import React, { useState } from 'react';
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
                className={\`sniffer-row \${selectedPacket?.id === p.id ? 'selected' : ''} proto-\${p.protocol.toLowerCase()}\`}
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
`, `.sniffer-app {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #181820;
  color: #f1f1f1;
  font-family: 'Segoe UI', system-ui, sans-serif;
}
.sniffer-toolbar {
  display: flex;
  gap: 8px;
  padding: 8px;
  background: #232330;
  border-bottom: 1px solid #323242;
}
.sniffer-filter-input {
  flex: 1;
  background: #101016;
  color: #fff;
  border: 1px solid #323242;
  padding: 6px 12px;
  border-radius: 4px;
}
.sniffer-btn {
  background: #2563eb;
  color: #fff;
  border: none;
  padding: 6px 14px;
  border-radius: 4px;
  cursor: pointer;
}
.sniffer-table-container {
  flex: 1;
  overflow: auto;
}
.sniffer-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}
.sniffer-table th {
  background: #20202c;
  padding: 6px 10px;
  text-align: left;
  border-bottom: 1px solid #323242;
  color: #9ca3af;
  position: sticky;
  top: 0;
}
.sniffer-table td {
  padding: 6px 10px;
  border-bottom: 1px solid #232330;
}
.sniffer-row { cursor: pointer; }
.sniffer-row:hover { background: #252535; }
.sniffer-row.selected { background: #3b82f6 !important; color: #fff; }
.proto-badge {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: bold;
}
.proto-tcp .proto-badge { background: #3b82f6; color: #fff; }
.proto-udp .proto-badge { background: #8b5cf6; color: #fff; }
.proto-dns .proto-badge { background: #10b981; color: #fff; }
.proto-http .proto-badge { background: #f59e0b; color: #fff; }
.proto-mqtt .proto-badge { background: #ec4899; color: #fff; }
.sniffer-detail-pane {
  height: 140px;
  background: #14141c;
  border-top: 1px solid #323242;
  padding: 10px;
  font-family: monospace;
  font-size: 12px;
  overflow: auto;
}
.detail-header { font-weight: bold; margin-bottom: 6px; color: #60a5fa; }
.detail-tree div { line-height: 20px; }
`);

// 4. MarkdownStudioApp
writeApp('markdown-studio', 'MarkdownStudioApp.tsx', `import React, { useState } from 'react';
import './MarkdownStudioApp.css';

export const MarkdownStudioApp: React.FC = () => {
  const [doc, setDoc] = useState(\`# WebOS Markdown Studio

Welcome to **WebOS Studio**, a full-featured live markdown authoring workspace.

## Highlights
- Real-time side-by-side rendering
- Math formulas & syntax formatting
- Native desktop export

### Code Sample
\`\`\`typescript
const kernel = WebOS.getKernel();
kernel.spawnProcess('terminal');
\`\`\`

> WebOS 6.0 Enterprise delivers high-performance multi-tasking on the web.
\`);

  const renderSimpleMarkdown = (md: string) => {
    return md
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
      .replace(/\\*\\*(.*?)\\*\\*/gim, '<strong>$1</strong>')
      .replace(/\\*(.*?)\\*/gim, '<em>$1</em>')
      .replace(/\\n/gim, '<br/>');
  };

  return (
    <div className="markdown-studio-app">
      <div className="md-toolbar">
        <span className="md-title">Document: Untitled.md</span>
        <div className="md-actions">
          <button className="md-btn" onClick={() => alert('Exporting HTML...')}>Export HTML</button>
        </div>
      </div>
      <div className="md-panes">
        <div className="md-editor-pane">
          <textarea
            value={doc}
            onChange={(e) => setDoc(e.target.value)}
            className="md-textarea"
          />
        </div>
        <div
          className="md-preview-pane"
          dangerouslySetInnerHTML={{ __html: renderSimpleMarkdown(doc) }}
        />
      </div>
    </div>
  );
};
`, `.markdown-studio-app {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #1e1e24;
  color: #fff;
}
.md-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 14px;
  background: #252530;
  border-bottom: 1px solid #333342;
}
.md-title { font-weight: bold; font-size: 13px; color: #60a5fa; }
.md-btn {
  background: #3b82f6;
  color: #fff;
  border: none;
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
}
.md-panes {
  display: flex;
  flex: 1;
  overflow: hidden;
}
.md-editor-pane, .md-preview-pane {
  flex: 1;
  height: 100%;
  overflow: auto;
}
.md-editor-pane {
  border-right: 1px solid #333342;
}
.md-textarea {
  width: 100%;
  height: 100%;
  background: #18181f;
  color: #e2e8f0;
  padding: 16px;
  font-family: 'Consolas', monospace;
  font-size: 14px;
  border: none;
  resize: none;
  outline: none;
}
.md-preview-pane {
  padding: 20px;
  background: #14141a;
  color: #e2e8f0;
  line-height: 1.6;
}
.md-preview-pane h1 { color: #60a5fa; margin-top: 0; }
.md-preview-pane h2 { color: #93c5fd; }
.md-preview-pane blockquote {
  border-left: 4px solid #3b82f6;
  padding-left: 12px;
  color: #9ca3af;
  margin: 12px 0;
}
`);

// 5. DiagramsApp
writeApp('diagrams', 'DiagramsApp.tsx', `import React, { useState } from 'react';
import './DiagramsApp.css';

export interface DiagramNode {
  id: string;
  title: string;
  x: number;
  y: number;
  category: 'Service' | 'Database' | 'Client' | 'Queue';
}

export const DiagramsApp: React.FC = () => {
  const [nodes, setNodes] = useState<DiagramNode[]>([
    { id: 'node-1', title: 'React Desktop Shell', x: 80, y: 120, category: 'Client' },
    { id: 'node-2', title: 'REST & WS Gateway', x: 300, y: 120, category: 'Service' },
    { id: 'node-3', title: 'POSIX VFS Kernel', x: 520, y: 70, category: 'Service' },
    { id: 'node-4', title: 'PostgreSQL 16 Cluster', x: 520, y: 200, category: 'Database' },
  ]);

  const addNode = () => {
    const nextId = \`node-\${nodes.length + 1}\`;
    setNodes([...nodes, {
      id: nextId,
      title: \`Microservice #\${nodes.length + 1}\`,
      x: 200 + nodes.length * 30,
      y: 240,
      category: 'Service',
    }]);
  };

  return (
    <div className="diagrams-app">
      <div className="diagrams-toolbar">
        <button className="diag-btn" onClick={addNode}>+ Add Node</button>
        <button className="diag-btn" onClick={() => alert('Layout refreshed!')}>Auto-Layout</button>
      </div>
      <div className="diagram-canvas">
        <svg className="connections-layer">
          <line x1={180} y1={140} x2={300} y2={140} stroke="#60a5fa" strokeWidth={2} strokeDasharray="4" />
          <line x1={400} y1={130} x2={520} y2={90} stroke="#60a5fa" strokeWidth={2} />
          <line x1={400} y1={150} x2={520} y2={220} stroke="#60a5fa" strokeWidth={2} />
        </svg>
        {nodes.map((n) => (
          <div
            key={n.id}
            className={\`diag-node cat-\${n.category.toLowerCase()}\`}
            style={{ left: n.x, top: n.y }}
          >
            <div className="node-cat">{n.category}</div>
            <div className="node-title">{n.title}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
`, `.diagrams-app {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #111827;
  color: #fff;
}
.diagrams-toolbar {
  display: flex;
  gap: 10px;
  padding: 10px;
  background: #1f2937;
  border-bottom: 1px solid #374151;
}
.diag-btn {
  background: #3b82f6;
  color: #fff;
  border: none;
  padding: 6px 14px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
}
.diagram-canvas {
  flex: 1;
  position: relative;
  background-image: radial-gradient(#374151 1px, transparent 1px);
  background-size: 20px 20px;
  overflow: auto;
}
.connections-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.diag-node {
  position: absolute;
  width: 140px;
  padding: 10px;
  border-radius: 6px;
  background: #1e293b;
  border: 1px solid #475569;
  box-shadow: 0 4px 6px rgba(0,0,0,0.3);
  cursor: move;
}
.node-cat {
  font-size: 10px;
  text-transform: uppercase;
  font-weight: bold;
  margin-bottom: 4px;
}
.cat-client .node-cat { color: #38bdf8; }
.cat-service .node-cat { color: #a855f7; }
.cat-database .node-cat { color: #10b981; }
.node-title {
  font-size: 12px;
  font-weight: 600;
}
`);

console.log('Desktop applications generated successfully.');
