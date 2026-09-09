/**
 * @file applications/database-viewer/DatabaseViewerApp.tsx
 * @description Main entry point for the WebOS Database Viewer application.
 */

import React, { useState, useEffect } from 'react';
import { useDatabaseViewerStore } from './store/databaseViewerStore.js';
import { DatabaseSidebar } from './components/DatabaseSidebar.js';
import { DatabaseGrid } from './components/DatabaseGrid.js';
import { DatabaseQueryEditor } from './components/DatabaseQueryEditor.js';
import { RecordEditorModal } from './components/RecordEditorModal.js';
import './databaseViewer.css';

export interface DatabaseViewerAppProps {
  windowId?: string;
}

export const DatabaseViewerApp: React.FC<DatabaseViewerAppProps> = ({ windowId }) => {
  const [activeViewTab, setActiveViewTab] = useState<'grid' | 'query'>('grid');
  const refreshDatabase = useDatabaseViewerStore((s) => s.refreshDatabase);

  useEffect(() => {
    refreshDatabase();
  }, []);

  return (
    <div className="wb-db-app" data-window-id={windowId}>
      <DatabaseSidebar />
      <div className="wb-db-main-content">
        <div className="wb-db-tab-bar">
          <div
            className={`wb-db-tab ${activeViewTab === 'grid' ? 'active' : ''}`}
            onClick={() => setActiveViewTab('grid')}
          >
            📊 Table Data Viewer
          </div>
          <div
            className={`wb-db-tab ${activeViewTab === 'query' ? 'active' : ''}`}
            onClick={() => setActiveViewTab('query')}
          >
            ⚡ SQL Query Console
          </div>
        </div>

        {activeViewTab === 'grid' ? <DatabaseGrid /> : <DatabaseQueryEditor />}
      </div>
      <RecordEditorModal />
    </div>
  );
};

export default DatabaseViewerApp;
