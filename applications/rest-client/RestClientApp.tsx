import React, { useState } from 'react';
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
  const [bodyText, setBodyText] = useState('{\n  "query": "system_diagnostics",\n  "verbosity": "full"\n}');
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
                className={`rest-tab-btn ${activeTab === t ? 'active' : ''}`}
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
