/**
 * @file applications/task-manager/components/TaskManagerHeader.tsx
 * @description Task Manager header with system metrics, search filter, and tab navigation.
 */

import React from 'react';
import { useTaskManagerStore } from '../store/taskManagerStore.js';

export const TaskManagerHeader: React.FC = () => {
  const metrics = useTaskManagerStore((s) => s.metrics);
  const activeTab = useTaskManagerStore((s) => s.activeTab);
  const filterQuery = useTaskManagerStore((s) => s.filterQuery);

  const setActiveTab = useTaskManagerStore((s) => s.setActiveTab);
  const setFilterQuery = useTaskManagerStore((s) => s.setFilterQuery);
  const refreshProcesses = useTaskManagerStore((s) => s.refreshProcesses);

  const formatUptime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="wb-tm-header">
      <div className="wb-tm-metrics-banner">
        <div className="wb-tm-metric-card">
          <div className="wb-tm-metric-val">{metrics.totalCpuPct}%</div>
          <div className="wb-tm-metric-label">CPU Usage</div>
        </div>

        <div className="wb-tm-metric-card">
          <div className="wb-tm-metric-val">{metrics.usedMemoryMb.toFixed(0)} MB</div>
          <div className="wb-tm-metric-label">Memory Used</div>
        </div>

        <div className="wb-tm-metric-card">
          <div className="wb-tm-metric-val">{metrics.processCount}</div>
          <div className="wb-tm-metric-label">Active Processes</div>
        </div>

        <div className="wb-tm-metric-card">
          <div className="wb-tm-metric-val">{metrics.appCount}</div>
          <div className="wb-tm-metric-label">Apps Running</div>
        </div>

        <div className="wb-tm-metric-card">
          <div className="wb-tm-metric-val">{formatUptime(metrics.uptimeSeconds)}</div>
          <div className="wb-tm-metric-label">System Uptime</div>
        </div>
      </div>

      <div className="wb-tm-control-bar">
        <div className="wb-tm-tabs">
          <button
            className={`wb-tm-tab ${activeTab === 'processes' ? 'active' : ''}`}
            onClick={() => setActiveTab('processes')}
          >
            📋 Processes
          </button>
          <button
            className={`wb-tm-tab ${activeTab === 'performance' ? 'active' : ''}`}
            onClick={() => setActiveTab('performance')}
          >
            📈 Performance
          </button>
        </div>

        <div className="wb-tm-actions">
          <input
            type="text"
            className="wb-tm-search-input"
            placeholder="Search PID, name, user..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
          />
          <button className="wb-tm-btn-refresh" title="Refresh Processes" onClick={refreshProcesses}>
            🔄 Refresh
          </button>
        </div>
      </div>
    </div>
  );
};
