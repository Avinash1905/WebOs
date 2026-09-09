import React, { useEffect, useState } from 'react';
import { Folder, FileText, ChevronRight, ChevronDown, FilePlus, FolderPlus, RefreshCw } from 'lucide-react';
import { useCodeEditorStore } from '../store/codeEditorStore.js';
import { platform } from '../../../src/services/webosPlatform.js';
import type { CodeExplorerNode } from '../types.js';

export const EditorFileExplorer: React.FC = () => {
  const {
    workspaceRoot,
    fileTree,
    refreshFileExplorer,
    openFileInEditor,
    createNewFile,
  } = useCodeEditorStore();

  const [expandedPaths, setExpandedPaths] = useState<Record<string, boolean>>({
    '/home/user': true,
  });

  useEffect(() => {
    refreshFileExplorer();
  }, [refreshFileExplorer]);

  const toggleExpand = (path: string) => {
    setExpandedPaths((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const handleCreateFile = async () => {
    const name = window.prompt('Enter new file name:');
    if (!name?.trim()) return;
    const targetPath = `${workspaceRoot === '/' ? '' : workspaceRoot}/${name.trim()}`;
    try {
      await platform.fileSystem.createFile(targetPath, { content: '' });
      await refreshFileExplorer();
      await openFileInEditor(targetPath);
    } catch (err: any) {
      alert(`Failed to create file: ${err?.message}`);
    }
  };

  const handleCreateFolder = async () => {
    const name = window.prompt('Enter new directory name:');
    if (!name?.trim()) return;
    const targetPath = `${workspaceRoot === '/' ? '' : workspaceRoot}/${name.trim()}`;
    try {
      await platform.fileSystem.createDirectory(targetPath);
      await refreshFileExplorer();
    } catch (err: any) {
      alert(`Failed to create directory: ${err?.message}`);
    }
  };

  const renderNode = (node: CodeExplorerNode) => {
    const isDir = node.type === 'directory';
    const isExpanded = expandedPaths[node.path];

    return (
      <div key={node.path} className="tree-node-wrapper">
        <div
          className="tree-node-row"
          onClick={() => {
            if (isDir) toggleExpand(node.path);
            else openFileInEditor(node.path);
          }}
        >
          {isDir ? (
            isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          ) : (
            <span className="tree-indent-spacer" />
          )}
          {isDir ? <Folder size={15} className="node-icon dir-icon" /> : <FileText size={15} className="node-icon file-icon" />}
          <span className="node-name">{node.name}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="editor-file-explorer">
      <div className="explorer-header">
        <span className="explorer-title">EXPLORER</span>
        <div className="explorer-actions">
          <button className="icon-btn" title="New File" onClick={handleCreateFile}>
            <FilePlus size={14} />
          </button>
          <button className="icon-btn" title="New Folder" onClick={handleCreateFolder}>
            <FolderPlus size={14} />
          </button>
          <button className="icon-btn" title="Refresh Explorer" onClick={refreshFileExplorer}>
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      <div className="explorer-root-bar">
        <span className="root-name">WORKSPACE ({workspaceRoot})</span>
      </div>

      <div className="explorer-tree-body">
        {fileTree.length === 0 ? (
          <div className="empty-tree">No files found.</div>
        ) : (
          fileTree.map(renderNode)
        )}
      </div>
    </div>
  );
};
