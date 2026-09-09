import React, { useState, useEffect } from 'react';
import { vfs } from '../../core/vfs/vfs';
import { Path } from '../../core/vfs/path';
import { VFSDirEntry } from '../../core/vfs/types';
import {
  Folder,
  FileText,
  FileCode,
  Image,
  Music,
  Video,
  ArrowLeft,
  ArrowUp,
  RotateCw,
  Plus,
  Trash2,
  HardDrive,
  Home,
  Download,
  FolderPlus,
} from 'lucide-react';
import './fileExplorer.css';

export const FileExplorerApp: React.FC<{ windowId: string; appId: string }> = () => {
  const [currentPath, setCurrentPath] = useState('/home/user');
  const [history, setHistory] = useState<string[]>(['/home/user']);
  const [historyIdx, setHistoryIdx] = useState(0);
  const [entries, setEntries] = useState<VFSDirEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  const loadDirectory = (dirPath: string) => {
    try {
      if (vfs.exists(dirPath)) {
        const list = vfs.readdir(dirPath);
        setEntries(list);
        setSelectedEntry(null);
      }
    } catch (err) {
      console.error('Failed to load directory:', err);
    }
  };

  useEffect(() => {
    loadDirectory(currentPath);
  }, [currentPath]);

  const navigateTo = (targetPath: string) => {
    const resolved = Path.resolve(currentPath, targetPath);
    if (vfs.exists(resolved) && vfs.stat(resolved).isDirectory()) {
      const nextHistory = history.slice(0, historyIdx + 1);
      nextHistory.push(resolved);
      setHistory(nextHistory);
      setHistoryIdx(nextHistory.length - 1);
      setCurrentPath(resolved);
    }
  };

  const navigateUp = () => {
    const parent = Path.dirname(currentPath);
    if (parent !== currentPath) {
      navigateTo(parent);
    }
  };

  const handleBack = () => {
    if (historyIdx > 0) {
      const prev = history[historyIdx - 1];
      setHistoryIdx(historyIdx - 1);
      setCurrentPath(prev);
    }
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    try {
      const newPath = Path.join(currentPath, newFolderName.trim());
      vfs.mkdir(newPath);
      setNewFolderName('');
      setIsCreatingFolder(false);
      loadDirectory(currentPath);
    } catch (e: any) {
      alert(`Error creating folder: ${e.message}`);
    }
  };

  const handleDeleteSelected = () => {
    if (!selectedEntry) return;
    try {
      const target = Path.join(currentPath, selectedEntry);
      const stat = vfs.stat(target);
      if (stat.isDirectory()) {
        vfs.rmdir(target);
      } else {
        vfs.unlink(target);
      }
      loadDirectory(currentPath);
    } catch (e: any) {
      alert(`Error deleting: ${e.message}`);
    }
  };

  const getFileIcon = (entry: VFSDirEntry) => {
    if (entry.type === 'directory') return <Folder size={24} className="entry-icon dir" />;
    const ext = Path.extname(entry.name).toLowerCase();
    if (['.js', '.ts', '.tsx', '.jsx', '.json', '.html', '.css'].includes(ext)) {
      return <FileCode size={24} className="entry-icon code" />;
    }
    if (['.png', '.jpg', '.jpeg', '.svg', '.webp'].includes(ext)) {
      return <Image size={24} className="entry-icon img" />;
    }
    if (['.mp3', '.wav', '.flac'].includes(ext)) {
      return <Music size={24} className="entry-icon audio" />;
    }
    if (['.mp4', '.webm', '.mkv'].includes(ext)) {
      return <Video size={24} className="entry-icon video" />;
    }
    return <FileText size={24} className="entry-icon file" />;
  };

  const SIDEBAR_SHORTCUTS = [
    { name: 'Home', path: '/home/user', icon: Home },
    { name: 'Desktop', path: '/home/user/Desktop', icon: HardDrive },
    { name: 'Documents', path: '/home/user/Documents', icon: FileText },
    { name: 'Downloads', path: '/home/user/Downloads', icon: Download },
    { name: 'Root System', path: '/', icon: HardDrive },
  ];

  return (
    <div className="file-explorer-container">
      {/* Top Action Bar */}
      <div className="explorer-topbar">
        <div className="nav-buttons">
          <button className="nav-btn" onClick={handleBack} disabled={historyIdx <= 0} title="Back">
            <ArrowLeft size={16} />
          </button>
          <button className="nav-btn" onClick={navigateUp} disabled={currentPath === '/'} title="Up">
            <ArrowUp size={16} />
          </button>
          <button className="nav-btn" onClick={() => loadDirectory(currentPath)} title="Refresh">
            <RotateCw size={14} />
          </button>
        </div>

        <div className="path-bar">
          <input
            type="text"
            className="path-input"
            value={currentPath}
            onChange={(e) => setCurrentPath(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') navigateTo(currentPath);
            }}
          />
        </div>

        <div className="explorer-actions">
          <button className="action-btn" onClick={() => setIsCreatingFolder(true)} title="New Folder">
            <FolderPlus size={15} />
            <span>New Folder</span>
          </button>
          <button
            className="action-btn danger"
            onClick={handleDeleteSelected}
            disabled={!selectedEntry}
            title="Delete Selected"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="explorer-body">
        {/* Left Sidebar */}
        <div className="explorer-sidebar">
          <div className="sidebar-section-title">Quick Access</div>
          {SIDEBAR_SHORTCUTS.map((s) => {
            const IconComp = s.icon;
            const isActive = currentPath === s.path;
            return (
              <button
                key={s.path}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
                onClick={() => navigateTo(s.path)}
              >
                <IconComp size={15} />
                <span>{s.name}</span>
              </button>
            );
          })}
        </div>

        {/* File Grid */}
        <div className="explorer-content" onClick={() => setSelectedEntry(null)}>
          {isCreatingFolder && (
            <div className="new-folder-dialog" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                className="new-folder-input"
                placeholder="Folder name..."
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateFolder();
                  if (e.key === 'Escape') setIsCreatingFolder(false);
                }}
              />
              <button className="btn-confirm" onClick={handleCreateFolder}>
                <Plus size={14} />
              </button>
            </div>
          )}

          <div className="file-grid">
            {entries.map((item) => {
              const isSelected = selectedEntry === item.name;
              return (
                <div
                  key={item.name}
                  className={`file-grid-item ${isSelected ? 'selected' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedEntry(item.name);
                  }}
                  onDoubleClick={() => {
                    if (item.type === 'directory') {
                      navigateTo(item.path);
                    }
                  }}
                >
                  <div className="file-icon-wrapper">{getFileIcon(item)}</div>
                  <div className="file-name" title={item.name}>
                    {item.name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="explorer-statusbar">
        <span>{entries.length} items</span>
        {selectedEntry && <span>Selected: {selectedEntry}</span>}
      </div>
    </div>
  );
};
