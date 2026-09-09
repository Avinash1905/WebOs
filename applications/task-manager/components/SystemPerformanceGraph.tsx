/**
 * @file applications/task-manager/components/SystemPerformanceGraph.tsx
 * @description Real-time SVG performance graphs for CPU utilization and Memory pool consumption over time.
 */

import React from 'react';
import { useTaskManagerStore } from '../store/taskManagerStore.js';

export const SystemPerformanceGraph: React.FC = () => {
  const metrics = useTaskManagerStore((s) => s.metrics);

  const generateCpuPolyline = (hist: number[]) => {
    if (hist.length === 0) return '';
    const width = 400;
    const height = 120;
    const maxCpu = 10; // 10% max scale
    const step = width / Math.max(1, hist.length - 1);

    return hist
      .map((val, idx) => {
        const x = idx * step;
        const y = height - (Math.min(val, maxCpu) / maxCpu) * height;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  };

  const generateMemoryPolyline = (hist: number[]) => {
    if (hist.length === 0) return '';
    const width = 400;
    const height = 120;
    const maxMem = 500; // 500 MB max scale
    const step = width / Math.max(1, hist.length - 1);

    return hist
      .map((val, idx) => {
        const x = idx * step;
        const y = height - (Math.min(val, maxMem) / maxMem) * height;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  };

  return (
    <div className="wb-tm-performance-view">
      <div className="wb-tm-graph-card">
        <div className="wb-tm-graph-header">
          <h4>📈 CPU Utilization</h4>
          <span className="wb-tm-graph-current">{metrics.totalCpuPct}%</span>
        </div>
        <div className="wb-tm-svg-container">
          <svg viewBox="0 0 400 120" className="wb-tm-svg-graph">
            <defs>
              <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <polyline
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
              points={generateCpuPolyline(metrics.cpuHistory)}
            />
          </svg>
        </div>
        <div className="wb-tm-graph-footer">60 second history window</div>
      </div>

      <div className="wb-tm-graph-card">
        <div className="wb-tm-graph-header">
          <h4>🧠 Memory Consumption</h4>
          <span className="wb-tm-graph-current">{metrics.usedMemoryMb.toFixed(1)} MB</span>
        </div>
        <div className="wb-tm-svg-container">
          <svg viewBox="0 0 400 120" className="wb-tm-svg-graph">
            <defs>
              <linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <polyline
              fill="none"
              stroke="#8b5cf6"
              strokeWidth="2"
              points={generateMemoryPolyline(metrics.memoryHistory)}
            />
          </svg>
        </div>
        <div className="wb-tm-graph-footer">Pool size: 4,096 MB Virtual RAM</div>
      </div>
    </div>
  );
};
