import React, { useState, useEffect } from 'react';
import { vfs } from '../../core/vfs/vfs';
import { Path } from '../../core/vfs/path';
import { useAppWindow } from '../../src/contracts/member3Adapters';
import {
  Save,
  Play,
  FileCode,
  FolderOpen,
  Plus,
  X,
  Check,
} from 'lucide-react';
import './codeEditor.css';

interface EditorTab {
  id: string;
  path: string;
  name: string;
  content: string;
  isDirty: boolean;
}

export const CodeEditorApp: React.FC<{ windowId: string; appId: string }> = ({ windowId, appId }) => {
  const win = useAppWindow(windowId, appId);
  const [tabs, setTabs] = useState<EditorTab[]>([
    {
      id: 'tab-1',
      path: '/home/user/Documents/sample.js',
      name: 'sample.js',
      content: '// WebOS Code Workspace\nfunction calculateStats(items) {\n  return {\n    count: items.length,\n    sum: items.reduce((a, b) => a + b, 0)\n  };\n}\nconsole.log(calculateStats([10, 20, 30]));\n',
      isDirty: false,
    },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('tab-1');
  const [outputConsole, setOutputConsole] = useState<string>('Console Ready.\n');
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [openFilePath, setOpenFilePath] = useState('/home/user/Welcome.txt');

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  useEffect(() => {
    // Attempt loading initial file from VFS
    if (activeTab && vfs.exists(activeTab.path)) {
      try {
        const text = vfs.readFile(activeTab.path, 'utf-8') as string;
        setTabs((prev) =>
          prev.map((t) => (t.id === activeTab.id ? { ...t, content: text, isDirty: false } : t))
        );
      } catch (err) {
        console.warn('Initial file read error:', err);
      }
    }
  }, []);

  const handleContentChange = (val: string) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTabId ? { ...t, content: val, isDirty: true } : t))
    );
  };

  const handleSave = () => {
    if (!activeTab) return;
    try {
      vfs.writeFile(activeTab.path, activeTab.content);
      setTabs((prev) =>
        prev.map((t) => (t.id === activeTab.id ? { ...t, isDirty: false } : t))
      );
      win.showNotification({
        title: 'File Saved',
        message: `Saved '${activeTab.name}' to ${activeTab.path}`,
        type: 'success',
      });
    } catch (e: any) {
      alert(`Save error: ${e.message}`);
    }
  };

  const handleRunCode = () => {
    if (!activeTab) return;
    setOutputConsole((prev) => prev + `\n--- Executing ${activeTab.name} ---\n`);

    const logs: string[] = [];
    const customConsole = {
      log: (...args: any[]) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
      error: (...args: any[]) => logs.push('[ERROR] ' + args.join(' ')),
      warn: (...args: any[]) => logs.push('[WARN] ' + args.join(' ')),
    };

    try {
      const runner = new Function('console', activeTab.content);
      runner(customConsole);
      setOutputConsole((prev) => prev + (logs.join('\n') || '[No output produced]') + '\n');
    } catch (err: any) {
      setOutputConsole((prev) => prev + `[RUNTIME EXCEPTION]: ${err.message}\n`);
    }
  };

  const handleOpenFromVfs = () => {
    if (!vfs.exists(openFilePath)) {
      alert('File does not exist in VFS');
      return;
    }
    const content = vfs.readFile(openFilePath, 'utf-8') as string;
    const name = Path.basename(openFilePath);
    const newTab: EditorTab = {
      id: `tab-${Date.now()}`,
      path: openFilePath,
      name,
      content,
      isDirty: false,
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);
    setShowOpenModal(false);
  };

  const handleCloseTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) return;
    const remaining = tabs.filter((t) => t.id !== id);
    setTabs(remaining);
    if (activeTabId === id) {
      setActiveTabId(remaining[0].id);
    }
  };

  const handleNewTab = () => {
    const newTab: EditorTab = {
      id: `tab-${Date.now()}`,
      path: `/home/user/untitled_${tabs.length + 1}.js`,
      name: `untitled_${tabs.length + 1}.js`,
      content: '// New JavaScript File\n',
      isDirty: true,
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);
  };

  const lines = (activeTab?.content || '').split('\n');

  return (
    <div className="code-editor-container">
      {/* Top Controls Toolbar */}
      <div className="editor-toolbar">
        <div className="editor-tools-left">
          <button className="tool-btn primary" onClick={handleSave} title="Save File (Ctrl+S)">
            <Save size={14} />
            <span>Save</span>
          </button>
          <button className="tool-btn run" onClick={handleRunCode} title="Execute Script">
            <Play size={14} />
            <span>Run</span>
          </button>
          <button className="tool-btn" onClick={() => setShowOpenModal(true)} title="Open File">
            <FolderOpen size={14} />
            <span>Open</span>
          </button>
        </div>

        <div className="editor-file-status">
          <FileCode size={14} className="file-status-icon" />
          <span>{activeTab?.path}</span>
          {activeTab?.isDirty && <span className="dirty-badge">*unsaved</span>}
        </div>
      </div>

      {/* Tabs Row */}
      <div className="editor-tabs-bar">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              className={`editor-tab ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTabId(tab.id)}
            >
              <span>{tab.name}</span>
              {tab.isDirty && <span className="tab-dirty-dot" />}
              {tabs.length > 1 && (
                <button
                  className="tab-close-btn"
                  onClick={(e) => handleCloseTab(tab.id, e)}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          );
        })}
        <button className="new-tab-btn" onClick={handleNewTab} title="New Document">
          <Plus size={14} />
        </button>
      </div>

      {/* Code Area & Line Numbers */}
      <div className="editor-main-split">
        <div className="code-editor-surface">
          <div className="line-gutter">
            {lines.map((_, i) => (
              <div key={i} className="line-num">
                {i + 1}
              </div>
            ))}
          </div>
          <textarea
            className="code-textarea"
            value={activeTab?.content || ''}
            onChange={(e) => handleContentChange(e.target.value)}
            spellCheck={false}
          />
        </div>

        {/* Execution Output Drawer */}
        <div className="editor-console-drawer">
          <div className="console-header">
            <span>Execution Console</span>
            <button className="console-clear-btn" onClick={() => setOutputConsole('')}>
              Clear
            </button>
          </div>
          <pre className="console-output">{outputConsole}</pre>
        </div>
      </div>

      {/* Open File Modal */}
      {showOpenModal && (
        <div className="editor-modal-backdrop" onClick={() => setShowOpenModal(false)}>
          <div className="editor-modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Open File from VFS</h3>
            <input
              type="text"
              className="modal-path-input"
              value={openFilePath}
              onChange={(e) => setOpenFilePath(e.target.value)}
              placeholder="/home/user/file.js"
              autoFocus
            />
            <div className="modal-actions">
              <button className="modal-btn secondary" onClick={() => setShowOpenModal(false)}>
                Cancel
              </button>
              <button className="modal-btn primary" onClick={handleOpenFromVfs}>
                <Check size={14} />
                Open
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
