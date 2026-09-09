/**
 * @file applications/task-manager/components/ProcessDetailsModal.tsx
 * @description Modal dialog displaying comprehensive process details, system metadata, permissions, and lifecycle triggers.
 */

import React from 'react';
import { useTaskManagerStore } from '../store/taskManagerStore.js';

export const ProcessDetailsModal: React.FC = () => {
  const isDetailsModalOpen = useTaskManagerStore((s) => s.isDetailsModalOpen);
  const inspectProcess = useTaskManagerStore((s) => s.inspectProcess);

  const closeInspectModal = useTaskManagerStore((s) => s.closeInspectModal);
  const suspendProcess = useTaskManagerStore((s) => s.suspendProcess);
  const resumeProcess = useTaskManagerStore((s) => s.resumeProcess);
  const terminateProcess = useTaskManagerStore((s) => s.terminateProcess);

  if (!isDetailsModalOpen || !inspectProcess) return null;

  return (
    <div className="wb-tm-modal-overlay" onClick={closeInspectModal}>
      <div className="wb-tm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="wb-tm-modal-header">
          <h3>🔍 Process Properties — {inspectProcess.name}</h3>
          <button className="wb-tm-modal-close" onClick={closeInspectModal}>
            ×
          </button>
        </div>

        <div className="wb-tm-modal-body">
          <div className="wb-tm-prop-row">
            <span className="label">PID:</span>
            <span className="val bold">{inspectProcess.pid}</span>
          </div>

          <div className="wb-tm-prop-row">
            <span className="label">Process Name:</span>
            <span className="val">{inspectProcess.name}</span>
          </div>

          <div className="wb-tm-prop-row">
            <span className="label">Application Identifier:</span>
            <span className="val code">{inspectProcess.appId}</span>
          </div>

          <div className="wb-tm-prop-row">
            <span className="label">Execution State:</span>
            <span className={`val badge ${inspectProcess.state}`}>
              {inspectProcess.state.toUpperCase()}
            </span>
          </div>

          <div className="wb-tm-prop-row">
            <span className="label">CPU Usage:</span>
            <span className="val">{inspectProcess.cpuPct.toFixed(1)}%</span>
          </div>

          <div className="wb-tm-prop-row">
            <span className="label">Memory Allocated:</span>
            <span className="val">{inspectProcess.memoryMb.toFixed(1)} MB</span>
          </div>

          <div className="wb-tm-prop-row">
            <span className="label">Priority Level:</span>
            <span className="val">{inspectProcess.priority.toUpperCase()}</span>
          </div>

          <div className="wb-tm-prop-row">
            <span className="label">Associated Window ID:</span>
            <span className="val">{inspectProcess.windowId || 'None (Background Service)'}</span>
          </div>

          <div className="wb-tm-prop-row">
            <span className="label">Thread Count:</span>
            <span className="val">{inspectProcess.threads}</span>
          </div>

          <div className="wb-tm-prop-row">
            <span className="label">Uptime:</span>
            <span className="val">{inspectProcess.uptimeSeconds} seconds</span>
          </div>

          <div className="wb-tm-prop-group">
            <span className="label">Declared System Permissions:</span>
            <div className="wb-tm-perm-chips">
              {inspectProcess.permissions.map((perm) => (
                <span key={perm} className="wb-tm-chip">
                  🛡️ {perm}
                </span>
              ))}
            </div>
          </div>

          <div className="wb-tm-prop-group">
            <span className="label">Process Description:</span>
            <p className="wb-tm-desc">{inspectProcess.description}</p>
          </div>
        </div>

        <div className="wb-tm-modal-footer">
          {inspectProcess.state === 'running' ? (
            <button
              className="wb-tm-btn sec"
              onClick={() => {
                suspendProcess(inspectProcess.pid);
                closeInspectModal();
              }}
            >
              ⏸️ Suspend
            </button>
          ) : (
            <button
              className="wb-tm-btn pri"
              onClick={() => {
                resumeProcess(inspectProcess.pid);
                closeInspectModal();
              }}
            >
              ▶️ Resume
            </button>
          )}

          <button
            className="wb-tm-btn danger"
            onClick={() => {
              terminateProcess(inspectProcess.pid);
              closeInspectModal();
            }}
          >
            ⏹️ End Process
          </button>
        </div>
      </div>
    </div>
  );
};
