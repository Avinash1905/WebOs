import React from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Monitor,
  Folder,
  Terminal as TerminalIcon,
  Settings as SettingsIcon,
  Trash2,
  FileText,
  Globe,
  Activity,
  Calculator as CalcIcon,
  Edit,
  File,
} from 'lucide-react';
import type { WindowBounds } from '../types/window';

export interface AppDefinition {
  id: string;
  name: string;
  category: 'System' | 'Utilities' | 'Productivity' | 'Entertainment' | 'Development';
  icon: LucideIcon | string | React.ReactNode;
  iconColor?: string;
  description?: string;
  version: string;
  keywords?: string[];
  defaultBounds?: Partial<WindowBounds>;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  canMaximize?: boolean;
  canMinimize?: boolean;
  canClose?: boolean;
  canResize?: boolean;
  singleInstance?: boolean;
  isPinnedToTaskbar?: boolean;
  showOnDesktop?: boolean;
  isFavorite?: boolean;
  component?: React.ComponentType<{ windowId: string; appId: string }>;
}

export interface IAppRegistry {
  registerApplication(app: AppDefinition): void;
  unregisterApplication(appId: string): void;
  getApplication(appId: string): AppDefinition | undefined;
  getAllApplications(): AppDefinition[];
  getDesktopApplications(): AppDefinition[];
  getPinnedApplications(): AppDefinition[];
  searchApplications(query: string): AppDefinition[];
}

export const BUILTIN_APPLICATIONS: AppDefinition[] = [
  {
    id: 'pc',
    name: 'This PC',
    category: 'System',
    icon: Monitor,
    iconColor: '#38bdf8',
    description: 'System hardware specs, storage drives, and OS telemetry overview.',
    version: '2.0.0',
    keywords: ['system', 'computer', 'storage', 'drives', 'specs', 'cpu', 'memory'],
    defaultBounds: { width: 780, height: 520 },
    showOnDesktop: true,
    isPinnedToTaskbar: true,
    isFavorite: true,
  },
  {
    id: 'file-manager',
    name: 'File Manager',
    category: 'Productivity',
    icon: Folder,
    iconColor: '#fbbf24',
    description: 'Browse, manage, search, and organize files and directories in WebOS.',
    version: '2.0.0',
    keywords: ['files', 'folder', 'explorer', 'docs', 'directory', 'storage', 'file-manager'],
    defaultBounds: { width: 880, height: 580 },
    showOnDesktop: true,
    isPinnedToTaskbar: true,
    isFavorite: true,
  },
  {
    id: 'documents',
    name: 'File Explorer',
    category: 'Productivity',
    icon: Folder,
    iconColor: '#fbbf24',
    description: 'Browse and organize files in WebOS.',
    version: '1.2.0',
    keywords: ['files', 'folder', 'explorer', 'docs', 'directory'],
    defaultBounds: { width: 840, height: 560 },
    showOnDesktop: false,
    isPinnedToTaskbar: false,
    isFavorite: false,
  },
  {
    id: 'text-editor',
    name: 'Text Editor',
    category: 'Productivity',
    icon: FileText,
    iconColor: '#60a5fa',
    description: 'Code and plain text editing workspace with tabs, autosave, and search/replace.',
    version: '2.0.0',
    keywords: ['notepad', 'notes', 'text', 'code', 'write', 'document', 'editor'],
    defaultBounds: { width: 800, height: 560 },
    showOnDesktop: true,
    isPinnedToTaskbar: true,
    isFavorite: true,
  },
  {
    id: 'editor',
    name: 'Code Editor',
    category: 'Productivity',
    icon: FileText,
    iconColor: '#60a5fa',
    description: 'Text editing workspace.',
    version: '1.0.4',
    keywords: ['notepad', 'text', 'code'],
    defaultBounds: { width: 700, height: 500 },
    showOnDesktop: false,
    isPinnedToTaskbar: false,
    isFavorite: false,
  },
  {
    id: 'notes',
    name: 'Notes',
    category: 'Productivity',
    icon: Edit,
    iconColor: '#a855f7',
    description: 'Knowledge and note taking app with folders, tags, search, and revision history.',
    version: '2.0.0',
    keywords: ['notes', 'memo', 'notebook', 'tasks', 'tags', 'checklist'],
    defaultBounds: { width: 840, height: 560 },
    showOnDesktop: true,
    isPinnedToTaskbar: true,
    isFavorite: true,
  },
  {
    id: 'document-editor',
    name: 'Document Editor',
    category: 'Productivity',
    icon: File,
    iconColor: '#3b82f6',
    description: 'Word processor with structured document layout, formatting, and tables.',
    version: '2.0.0',
    keywords: ['word', 'document', 'writer', 'table', 'formatting', 'office'],
    defaultBounds: { width: 920, height: 620 },
    showOnDesktop: true,
    isPinnedToTaskbar: true,
    isFavorite: true,
  },
  {
    id: 'terminal',
    name: 'Terminal',
    category: 'Development',
    icon: TerminalIcon,
    iconColor: '#34d399',
    description: 'Command line interface shell with built-in scripting tools.',
    version: '2.1.0',
    keywords: ['cli', 'bash', 'shell', 'console', 'cmd', 'command', 'terminal'],
    defaultBounds: { width: 720, height: 460 },
    showOnDesktop: true,
    isPinnedToTaskbar: true,
    isFavorite: true,
  },
  {
    id: 'browser',
    name: 'Web Browser',
    category: 'Utilities',
    icon: Globe,
    iconColor: '#06b6d4',
    description: 'Sandboxed browser to explore external web content and web apps.',
    version: '1.5.0',
    keywords: ['internet', 'web', 'browser', 'surf', 'chrome', 'edge'],
    defaultBounds: { width: 920, height: 600 },
    showOnDesktop: false,
    isPinnedToTaskbar: true,
    isFavorite: false,
  },
  {
    id: 'calculator',
    name: 'Calculator',
    category: 'Utilities',
    icon: CalcIcon,
    iconColor: '#f472b6',
    description: 'Standard and scientific mathematical calculation utility.',
    version: '1.1.0',
    keywords: ['math', 'calculate', 'numbers', 'arithmetic'],
    defaultBounds: { width: 360, height: 480 },
    minWidth: 320,
    minHeight: 440,
    showOnDesktop: false,
    isPinnedToTaskbar: false,
    isFavorite: false,
  },
  {
    id: 'monitor',
    name: 'System Monitor',
    category: 'System',
    icon: Activity,
    iconColor: '#ef4444',
    description: 'Live CPU, memory usage graphs, and active process tree monitor.',
    version: '1.3.0',
    keywords: ['task manager', 'processes', 'cpu', 'ram', 'performance', 'metrics'],
    defaultBounds: { width: 760, height: 480 },
    showOnDesktop: false,
    isPinnedToTaskbar: false,
    isFavorite: true,
  },
  {
    id: 'settings',
    name: 'Settings',
    category: 'System',
    icon: SettingsIcon,
    iconColor: '#a78bfa',
    description: 'Configure desktop theme, wallpapers, display scale, and audio.',
    version: '2.0.0',
    keywords: ['config', 'preferences', 'wallpaper', 'theme', 'display', 'settings'],
    defaultBounds: { width: 800, height: 540 },
    showOnDesktop: true,
    isPinnedToTaskbar: true,
    isFavorite: true,
  },
  {
    id: 'recycle-bin',
    name: 'Recycle Bin',
    category: 'System',
    icon: Trash2,
    iconColor: '#94a3b8',
    description: 'Deleted items container with recovery and permanent purge options.',
    version: '1.0.0',
    keywords: ['trash', 'delete', 'recycle', 'bin', 'restore'],
    defaultBounds: { width: 680, height: 440 },
    showOnDesktop: true,
    isPinnedToTaskbar: false,
    isFavorite: false,
  },
];

class AppRegistryImpl implements IAppRegistry {
  private apps = new Map<string, AppDefinition>();

  constructor() {
    BUILTIN_APPLICATIONS.forEach((app) => this.registerApplication(app));
  }

  registerApplication(app: AppDefinition): void {
    this.apps.set(app.id, app);
  }

  unregisterApplication(appId: string): void {
    this.apps.delete(appId);
  }

  getApplication(appId: string): AppDefinition | undefined {
    return this.apps.get(appId);
  }

  getAllApplications(): AppDefinition[] {
    return Array.from(this.apps.values());
  }

  getDesktopApplications(): AppDefinition[] {
    return this.getAllApplications().filter((a) => a.showOnDesktop !== false);
  }

  getPinnedApplications(): AppDefinition[] {
    return this.getAllApplications().filter((a) => a.isPinnedToTaskbar);
  }

  searchApplications(query: string): AppDefinition[] {
    if (!query || !query.trim()) return this.getAllApplications();
    const cleanQuery = query.toLowerCase().trim();
    return this.getAllApplications().filter((app) => {
      const matchName = app.name.toLowerCase().includes(cleanQuery);
      const matchCategory = app.category.toLowerCase().includes(cleanQuery);
      const matchDescription = app.description?.toLowerCase().includes(cleanQuery);
      const matchKeywords = app.keywords?.some((k) => k.toLowerCase().includes(cleanQuery));
      return matchName || matchCategory || matchDescription || matchKeywords;
    });
  }
}

export const appRegistry: IAppRegistry = new AppRegistryImpl();
