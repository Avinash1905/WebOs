/**
 * @file FileManagerPropertiesModal.tsx
 * @description File/Folder properties metadata modal.
 */

import React from 'react';
import { X, FileText, Folder, HardDrive, Clock, ShieldCheck } from 'lucide-react';
import { useFileManagerStore } from '../store/fileManagerStore.js';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(timestamp: number): string {
  if (!timestamp) return 'Unknown';
  return new Date(timestamp).toLocaleString();
}

export const FileManagerPropertiesModal: React.FC = () => {
  const { propertiesItem, setPropertiesItem } = useFileManagerStore();

  if (!propertiesItem) return null;

  const isFolder = propertiesItem.type === 'directory';

  return (
    <div className="fm-modal-overlay" onClick={() => setPropertiesItem(null)}>
      <div className="fm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="fm-modal-header">
          <div className="fm-modal-title">
            {isFolder ? <Folder size={18} className="fm-folder-icon" /> : <FileText size={18} className="fm-file-icon" />}
            <span>Properties — {propertiesItem.name}</span>
          </div>
          <button className="fm-modal-close" onClick={() => setPropertiesItem(null)}>
            <X size={16} />
          </button>
        </div>

        <div className="fm-modal-body">
          <div className="fm-prop-row">
            <span className="fm-prop-label">Name:</span>
            <span className="fm-prop-value bold">{propertiesItem.name}</span>
          </div>
          <div className="fm-prop-row">
            <span className="fm-prop-label">Type:</span>
            <span className="fm-prop-value">{isFolder ? 'Folder' : propertiesItem.mimeType || 'File'}</span>
          </div>
          <div className="fm-prop-row">
            <span className="fm-prop-label">Location:</span>
            <span className="fm-prop-value code">{propertiesItem.path}</span>
          </div>
          <div className="fm-prop-row">
            <span className="fm-prop-label">Size:</span>
            <span className="fm-prop-value">{formatBytes(propertiesItem.size)}</span>
          </div>
          <div className="fm-prop-row">
            <span className="fm-prop-label">Created:</span>
            <span className="fm-prop-value">{formatDate(propertiesItem.createdAt)}</span>
          </div>
          <div className="fm-prop-row">
            <span className="fm-prop-label">Modified:</span>
            <span className="fm-prop-value">{formatDate(propertiesItem.modifiedAt)}</span>
          </div>
          <div className="fm-prop-row">
            <span className="fm-prop-label">Permissions:</span>
            <span className="fm-prop-value badge-perm">
              <ShieldCheck size={14} /> Read & Write (Granted)
            </span>
          </div>
        </div>

        <div className="fm-modal-footer">
          <button className="fm-btn fm-btn-accent" onClick={() => setPropertiesItem(null)}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
