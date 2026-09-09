/**
 * @file applications/task-manager/TaskManagerApp.tsx
 * @description Main entry point for WebOS Task Manager application.
 */

import React, { useEffect } from 'react';
import { useTaskManagerStore } from './store/taskManagerStore.js';
import { TaskManagerHeader } from './components/TaskManagerHeader.js';
import { ProcessTable } from './components/ProcessTable.js';
import { SystemPerformanceGraph } from './components/SystemPerformanceGraph.js';
import { ProcessDetailsModal } from './components/ProcessDetailsModal.js';
import './taskManager.css';

export interface TaskManagerAppProps {
  windowId?: string;
}

export const TaskManagerApp: React.FC<TaskManagerAppProps> = ({ windowId }) => {
  const activeTab = useTaskManagerStore((s) => s.activeTab);
  const refreshProcesses = useTaskManagerStore((s) => s.refreshProcesses);

  useEffect(() => {
    refreshProcesses();
    const timer = setInterval(() => {
      refreshProcesses();
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="wb-tm-app" data-window-id={windowId}>
      <TaskManagerHeader />
      {activeTab === 'processes' ? <ProcessTable /> : <SystemPerformanceGraph />}
      <ProcessDetailsModal />
    </div>
  );
};

export default TaskManagerApp;
