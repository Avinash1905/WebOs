/**
 * @file FileManagerBreadcrumb.tsx
 * @description Path breadcrumb navigation bar with direct path editing capability.
 */

import React, { useState, useEffect } from 'react';
import { Home, ChevronRight, Edit2 } from 'lucide-react';
import { useFileManagerStore } from '../store/fileManagerStore.js';

export const FileManagerBreadcrumb: React.FC = () => {
  const { currentPath, navigateTo } = useFileManagerStore();
  const [isEditing, setIsEditing] = useState(false);
  const [inputPath, setInputPath] = useState(currentPath);

  useEffect(() => {
    setInputPath(currentPath);
  }, [currentPath]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
      navigateTo(inputPath.trim());
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setInputPath(currentPath);
    }
  };

  const pathParts = currentPath.split('/').filter(Boolean);

  return (
    <div className="fm-breadcrumb-bar">
      <div className="fm-breadcrumb-container">
        {isEditing ? (
          <input
            type="text"
            className="fm-breadcrumb-input"
            value={inputPath}
            onChange={(e) => setInputPath(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => setIsEditing(false)}
            autoFocus
          />
        ) : (
          <div className="fm-breadcrumb-crumbs" onClick={() => setIsEditing(true)}>
            <button
              className="fm-crumb-item"
              onClick={(e) => {
                e.stopPropagation();
                navigateTo('/home/user');
              }}
              title="Go to Home (/home/user)"
            >
              <Home size={14} />
              <span>Root</span>
            </button>

            {pathParts.map((part, index) => {
              const fullPath = '/' + pathParts.slice(0, index + 1).join('/');
              const isLast = index === pathParts.length - 1;

              return (
                <React.Fragment key={fullPath}>
                  <ChevronRight size={14} className="fm-crumb-separator" />
                  <button
                    className={`fm-crumb-item ${isLast ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateTo(fullPath);
                    }}
                  >
                    {part}
                  </button>
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>

      <button
        className="fm-btn-edit-path"
        title="Direct Path Input"
        onClick={() => setIsEditing(!isEditing)}
      >
        <Edit2 size={14} />
      </button>
    </div>
  );
};
