/**
 * @file applications/task-manager/components/ProcessTable.tsx
 * @description Table displaying live WebOS processes with sorting, selection, and lifecycle controls.
 */

import React from 'react';
import { useTaskManagerStore } from '../store/taskManagerStore.js';
import type { ProcessInfo } from '../types.js';

export const ProcessTable: React.FC = () => {
  const processes = useTaskManagerStore((s) => s.processes);
  const selectedPid = useTaskManagerStore((s) => s.selectedPid);
  const preferences = useTaskManagerStore((s) => s.preferences);

  const selectProcess = useTaskManagerStore((s) => s.selectProcess);
  const setSort = useTaskManagerStore((s) => s.setSort);
  const openInspectModal = useTaskManagerStore((s) => s.openInspectModal);
  const suspendProcess = useTaskManagerStore((s) => s.suspendProcess);
  const resumeProcess = useTaskManagerStore((s) => s.resumeProcess);
  const terminateProcess = useTaskManagerStore((s) => s.terminateProcess);
  const killProcess = useTaskManagerStore((s) => s.killProcess);

  const handleEndTask = (proc: ProcessInfo) => {
    if (confirm(`Are you sure you want to terminate process '${proc.name}' (PID: ${proc.pid})?`)) {
      terminateProcess(proc.pid);
    }
  };

  const handleKill = (proc: ProcessInfo) => {
    if (confirm(`FORCE KILL process '${proc.name}' (PID: ${proc.pid})? This may lose unsaved data.`)) {
      killProcess(proc.pid);
    }
  };

  const renderSortIndicator = (col: keyof ProcessInfo) => {
    if (preferences.sortBy !== col) return null;
    return <span className="wb-tm-sort-arrow">{preferences.sortDirection === 'asc' ? '▲' : '▼'}</span>;
  };

  return (
    <div className="wb-tm-table-container">
      <table className="wb-tm-table">
        <thead>
          <tr>
            <th onClick={() => setSort('pid')}>PID {renderSortIndicator('pid')}</th>
            <th onClick={() => setSort('name')}>Process Name {renderSortIndicator('name')}</th>
            <th onClick={() => setSort('appId')}>Application {renderSortIndicator('appId')}</th>
            <th onClick={() => setSort('user')}>User {renderSortIndicator('user')}</th>
            <th onClick={() => setSort('state')}>State {renderSortIndicator('state')}</th>
            <th onClick={() => setSort('cpuPct')}>CPU % {renderSortIndicator('cpuPct')}</th>
            <th onClick={() => setSort('memoryMb')}>Memory {renderSortIndicator('memoryMb')}</th>
            <th onClick={() => setSort('priority')}>Priority {renderSortIndicator('priority')}</th>
            <th className="wb-tm-action-col">Controls</th>
          </tr>
        </thead>
        <tbody>
          {processes.length === 0 ? (
            <tr>
              <td colSpan={9} className="wb-tm-no-proc">
                No active processes found.
              </td>
            </tr>
          ) : (
            processes.map((proc) => {
              const isSelected = selectedPid === proc.pid;

              return (
                <tr
                  key={proc.pid}
                  className={`wb-tm-tr ${isSelected ? 'selected' : ''}`}
                  onClick={() => selectProcess(proc.pid)}
                  onDoubleClick={() => openInspectModal(proc)}
                >
                  <td className="wb-tm-pid">{proc.pid}</td>
                  <td className="wb-tm-name">
                    <span className="wb-tm-app-icon">⚙️</span>
                    <span>{proc.name}</span>
                  </td>
                  <td className="wb-tm-appid">{proc.appId}</td>
                  <td>{proc.user}</td>
                  <td>
                    <span className={`wb-tm-badge ${proc.state}`}>
                      {proc.state.toUpperCase()}
                    </span>
                  </td>
                  <td className="wb-tm-cpu">{proc.cpuPct.toFixed(1)}%</td>
                  <td className="wb-tm-mem">{proc.memoryMb.toFixed(1)} MB</td>
                  <td>
                    <span className={`wb-tm-prio ${proc.priority}`}>
                      {proc.priority.toUpperCase()}
                    </span>
                  </td>
                  <td className="wb-tm-actions-td">
                    <button
                      className="wb-tm-btn-icon"
                      title="Inspect Process Details"
                      onClick={(e) => {
                        e.stopPropagation();
                        openInspectModal(proc);
                      }}
                    >
                      🔍
                    </button>

                    {proc.state === 'running' ? (
                      <button
                        className="wb-tm-btn-icon"
                        title="Suspend Process"
                        onClick={(e) => {
                          e.stopPropagation();
                          suspendProcess(proc.pid);
                        }}
                      >
                        ⏸️
                      </button>
                    ) : (
                      <button
                        className="wb-tm-btn-icon"
                        title="Resume Process"
                        onClick={(e) => {
                          e.stopPropagation();
                          resumeProcess(proc.pid);
                        }}
                      >
                        ▶️
                      </button>
                    )}

                    <button
                      className="wb-tm-btn-icon warn"
                      title="End Task"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEndTask(proc);
                      }}
                    >
                      ⏹️
                    </button>

                    <button
                      className="wb-tm-btn-icon danger"
                      title="Force Kill Process"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleKill(proc);
                      }}
                    >
                      ⚡
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
