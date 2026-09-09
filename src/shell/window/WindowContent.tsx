/**
 * @file WindowContent.tsx
 * @description Router and container component for rendering WebOS applications inside Window Manager.
 */

import React from 'react';
import { FileManagerApp } from '../../../applications/file-manager/FileManagerApp.js';
import { TextEditorApp } from '../../../applications/text-editor/TextEditorApp.js';
import { NotesApp } from '../../../applications/notes/NotesApp.js';
import { DocumentEditorApp } from '../../../applications/document-editor/DocumentEditorApp.js';

export interface WindowContentProps {
  children?: React.ReactNode;
  className?: string;
  appId?: string;
  data?: any;
}

export const WindowContent: React.FC<WindowContentProps> = ({ children, className, appId, data }) => {
  const renderApp = () => {
    if (children) return children;

    switch (appId) {
      case 'file-manager':
      case 'documents':
        return <FileManagerApp />;
      case 'text-editor':
      case 'editor':
        return <TextEditorApp initialFilePath={data?.initialFilePath} />;
      case 'notes':
        return <NotesApp />;
      case 'document-editor':
        return <DocumentEditorApp initialFilePath={data?.initialFilePath} />;
      default:
        return null;
    }
  };

  const appElement = renderApp();

  return (
    <div className={`os-window-content ${className || ''}`} tabIndex={-1}>
      {appElement || (
        <div className="os-window__default-content">
          <div className="os-window__placeholder-card">
            <h3>WebOS Application</h3>
            <p>Sandbox execution context.</p>
            <div className="os-window__app-badge">App ID: {appId}</div>
          </div>
        </div>
      )}
    </div>
  );
};
