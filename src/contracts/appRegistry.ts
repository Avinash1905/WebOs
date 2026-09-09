import React from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Monitor,
  Folder,
  Terminal as TerminalIcon,
  Settings as SettingsIcon,
  Trash2,
  FileText,
  Activity,
  Calculator as CalcIcon,
  BookOpen,
  PenTool,
  FileSpreadsheet,
  Database,
  Calendar as CalendarIcon,
  Music,
} from 'lucide-react';
import type { WindowBounds } from '../types/window';

import { TerminalApp } from '../../applications/terminal/TerminalApp';
import { FileExplorerApp } from '../../applications/file-explorer/FileExplorerApp';
import { CodeEditorApp } from '../../applications/code-editor/CodeEditorApp';
import { CalculatorApp } from '../../applications/calculator/CalculatorApp';
import { SystemMonitorApp } from '../../applications/system-monitor/SystemMonitorApp';
import { NotesApp } from '../../applications/notes/NotesApp';
import { DrawingStudioApp } from '../../applications/drawing/DrawingStudioApp';
import { SpreadsheetApp } from '../../applications/spreadsheet/SpreadsheetApp';
import { DbStudioApp } from '../../applications/db-studio/DbStudioApp';
import { CalendarApp } from '../../applications/calendar/CalendarApp';
import { MediaPlayerApp } from '../../applications/media-player/MediaPlayerApp';
import { SettingsApp } from '../shell/settings/SettingsApp';

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
    component: SystemMonitorApp,
  },
  {
    id: 'documents',
    name: 'File Explorer',
    category: 'Productivity',
    icon: Folder,
    iconColor: '#fbbf24',
    description: 'Browse, manage, and organize files and directories in WebOS.',
    version: '1.2.0',
    keywords: ['files', 'folder', 'explorer', 'docs', 'directory', 'storage'],
    defaultBounds: { width: 840, height: 560 },
    showOnDesktop: true,
    isPinnedToTaskbar: true,
    isFavorite: true,
    component: FileExplorerApp,
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
    component: TerminalApp,
  },
  {
    id: 'editor',
    name: 'Code Editor',
    category: 'Development',
    icon: FileText,
    iconColor: '#60a5fa',
    description: 'Clean text and code editing workspace with syntax styling and execution.',
    version: '1.0.4',
    keywords: ['notepad', 'notes', 'text', 'code', 'write', 'document', 'ide'],
    defaultBounds: { width: 800, height: 540 },
    showOnDesktop: false,
    isPinnedToTaskbar: false,
    isFavorite: true,
    component: CodeEditorApp,
  },
  {
    id: 'notes',
    name: 'Notes Studio',
    category: 'Productivity',
    icon: BookOpen,
    iconColor: '#f59e0b',
    description: 'Markdown note taking with tagging, categories, and instant search.',
    version: '2.0.0',
    keywords: ['notes', 'memo', 'markdown', 'write', 'todo'],
    defaultBounds: { width: 760, height: 500 },
    showOnDesktop: true,
    isPinnedToTaskbar: false,
    isFavorite: true,
    component: NotesApp,
  },
  {
    id: 'calculator',
    name: 'Calculator',
    category: 'Utilities',
    icon: CalcIcon,
    iconColor: '#f472b6',
    description: 'Standard and scientific mathematical calculation utility.',
    version: '1.1.0',
    keywords: ['math', 'calculate', 'numbers', 'arithmetic', 'scientific'],
    defaultBounds: { width: 360, height: 500 },
    minWidth: 320,
    minHeight: 440,
    showOnDesktop: false,
    isPinnedToTaskbar: false,
    isFavorite: false,
    component: CalculatorApp,
  },
  {
    id: 'monitor',
    name: 'Task Manager',
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
    component: SystemMonitorApp,
  },
  {
    id: 'spreadsheet',
    name: 'WebCalc Spreadsheet',
    category: 'Productivity',
    icon: FileSpreadsheet,
    iconColor: '#10b981',
    description: 'Full-featured spreadsheet with formula evaluation and CSV export.',
    version: '1.0.0',
    keywords: ['excel', 'sheets', 'spreadsheet', 'calc', 'csv', 'table'],
    defaultBounds: { width: 840, height: 540 },
    showOnDesktop: false,
    isPinnedToTaskbar: false,
    isFavorite: true,
    component: SpreadsheetApp,
  },
  {
    id: 'drawing',
    name: 'Drawing Studio',
    category: 'Entertainment',
    icon: PenTool,
    iconColor: '#a855f7',
    description: 'Interactive canvas drawing, sketching, shapes, and image export.',
    version: '1.0.0',
    keywords: ['draw', 'paint', 'sketch', 'art', 'canvas', 'whiteboard'],
    defaultBounds: { width: 820, height: 540 },
    showOnDesktop: true,
    isPinnedToTaskbar: false,
    isFavorite: false,
    component: DrawingStudioApp,
  },
  {
    id: 'calendar',
    name: 'Calendar',
    category: 'Productivity',
    icon: CalendarIcon,
    iconColor: '#ec4899',
    description: 'Event scheduling, appointments, reminders, and monthly planner.',
    version: '1.0.0',
    keywords: ['calendar', 'events', 'schedule', 'planner', 'date', 'agenda'],
    defaultBounds: { width: 800, height: 520 },
    showOnDesktop: false,
    isPinnedToTaskbar: false,
    isFavorite: true,
    component: CalendarApp,
  },
  {
    id: 'media',
    name: 'Media Player',
    category: 'Entertainment',
    icon: Music,
    iconColor: '#c084fc',
    description: 'Audio and media player with dynamic visualizer and playlists.',
    version: '1.0.0',
    keywords: ['music', 'audio', 'player', 'media', 'songs', 'sound'],
    defaultBounds: { width: 680, height: 480 },
    showOnDesktop: false,
    isPinnedToTaskbar: false,
    isFavorite: false,
    component: MediaPlayerApp,
  },
  {
    id: 'db-studio',
    name: 'WebDB Studio',
    category: 'Development',
    icon: Database,
    iconColor: '#06b6d4',
    description: 'PostgreSQL database query runner, table schema browser, and data inspector.',
    version: '1.0.0',
    keywords: ['database', 'sql', 'postgres', 'db', 'query', 'tables'],
    defaultBounds: { width: 860, height: 560 },
    showOnDesktop: false,
    isPinnedToTaskbar: false,
    isFavorite: true,
    component: DbStudioApp,
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
    component: SettingsApp,
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
    component: FileExplorerApp,
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
