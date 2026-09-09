import React, { useState, useEffect } from 'react';
import { processManager } from '../../core/process/processManager';
import { scheduler } from '../../core/process/scheduler';
import { Activity, Cpu, HardDrive, Trash2, RefreshCw } from 'lucide-react';
import './systemMonitor.css';

export const SystemMonitorApp: React.FC<{ windowId: string; appId: string }> = () => {
  const [processes, setProcesses] = useState(processManager.listProcesses());
  const [stats, setStats] = useState(scheduler.getStats());
  const [selectedPid, setSelectedPid] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'processes' | 'resources' | 'storage'>('processes');

  useEffect(() => {
    const interval = setInterval(() => {
      setProcesses(processManager.listProcesses());
      setStats(scheduler.getStats());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleKill = (pid: number) => {
    processManager.kill(pid);
    setProcesses(processManager.listProcesses());
  };

  const totalMemMb = 16384;
  const usedMemMb = processes.reduce((acc, p) => acc + (p.memory?.heapUsed || 1024), 0) / 1024;
  const memPercent = Math.min(100, Math.round((usedMemMb / totalMemMb) * 100 * 10));

  return (
    <div className="system-monitor-container">
      {/* Tab Navigation */}
      <div className="monitor-tabs">
        <button
          className={`tab-btn ${activeTab === 'processes' ? 'active' : ''}`}
          onClick={() => setActiveTab('processes')}
        >
          <Activity size={14} />
          <span>Processes ({processes.length})</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'resources' ? 'active' : ''}`}
          onClick={() => setActiveTab('resources')}
        >
          <Cpu size={14} />
          <span>Performance & CPU</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'storage' ? 'active' : ''}`}
          onClick={() => setActiveTab('storage')}
        >
          <HardDrive size={14} />
          <span>Storage</span>
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="monitor-content">
        {activeTab === 'processes' && (
          <div className="process-table-wrapper">
            <div className="process-toolbar">
              <div className="selected-proc-info">
                {selectedPid ? `PID: ${selectedPid} selected` : 'Select a process to manage'}
              </div>
              <div className="proc-actions">
                <button
                  className="proc-btn danger"
                  disabled={!selectedPid || selectedPid === 1}
                  onClick={() => selectedPid && handleKill(selectedPid)}
                >
                  <Trash2 size={13} />
                  <span>End Process</span>
                </button>
                <button
                  className="proc-btn"
                  onClick={() => setProcesses(processManager.listProcesses())}
                >
                  <RefreshCw size={13} />
                </button>
              </div>
            </div>

            <table className="process-table">
              <thead>
                <tr>
                  <th>PID</th>
                  <th>Name</th>
                  <th>User</th>
                  <th>Status</th>
                  <th>CPU %</th>
                  <th>Memory</th>
                  <th>Priority</th>
                </tr>
              </thead>
              <tbody>
                {processes.map((p) => {
                  const isSelected = selectedPid === p.pid;
                  const memMb = (p.memory.heapUsed / 1024).toFixed(1);
                  return (
                    <tr
                      key={p.pid}
                      className={isSelected ? 'selected' : ''}
                      onClick={() => setSelectedPid(p.pid)}
                    >
                      <td>{p.pid}</td>
                      <td className="proc-name">{p.name}</td>
                      <td>{p.uid === 0 ? 'root' : 'user'}</td>
                      <td>
                        <span className={`status-tag ${p.state}`}>{p.state}</span>
                      </td>
                      <td>{p.stats.cpuUsagePercent || '< 1'}%</td>
                      <td>{memMb} MB</td>
                      <td>{p.priority}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'resources' && (
          <div className="resources-grid">
            <div className="metric-card">
              <div className="metric-header">
                <Cpu size={18} className="text-cyan" />
                <span>CPU Utilization</span>
              </div>
              <div className="metric-val">{100 - stats.idlePercentage}%</div>
              <div className="progress-bar">
                <div
                  className="progress-fill cyan"
                  style={{ width: `${100 - stats.idlePercentage}%` }}
                />
              </div>
              <div className="metric-detail">Context Switches: {stats.totalContextSwitches}</div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <Activity size={18} className="text-emerald" />
                <span>Memory Allocation</span>
              </div>
              <div className="metric-val">{memPercent}%</div>
              <div className="progress-bar">
                <div
                  className="progress-fill emerald"
                  style={{ width: `${memPercent}%` }}
                />
              </div>
              <div className="metric-detail">{usedMemMb.toFixed(1)} MB / 16 GB</div>
            </div>
          </div>
        )}

        {activeTab === 'storage' && (
          <div className="storage-view">
            <div className="storage-card">
              <h3>Root Virtual Filesystem (rootfs)</h3>
              <p>Type: in-memory VFS / LocalStorage Persistence</p>
              <div className="progress-bar">
                <div className="progress-fill amber" style={{ width: '24%' }} />
              </div>
              <div className="metric-detail">2.4 GB used of 10.0 GB virtual capacity</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
