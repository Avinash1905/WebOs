import React, { useState } from 'react';
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
    const nextId = `node-${nodes.length + 1}`;
    setNodes([...nodes, {
      id: nextId,
      title: `Microservice #${nodes.length + 1}`,
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
            className={`diag-node cat-${n.category.toLowerCase()}`}
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
