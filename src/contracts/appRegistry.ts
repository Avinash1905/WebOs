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
  Film,
  Gamepad2,
  Sun,
  Clock as ClockIcon,
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
import { PaintApp } from '../../applications/paint/PaintApp';
import { PdfViewerApp } from '../../applications/pdf-viewer/PdfViewerApp';
import { VideoPlayerApp } from '../../applications/video-player/VideoPlayerApp';
import { AudioWorkstationApp } from '../../applications/audio-workstation/AudioWorkstationApp';
import { GameCenterApp } from '../../applications/game-center/GameCenterApp';
import { WeatherApp } from '../../applications/weather/WeatherApp';
import { ClockApp } from '../../applications/clock/ClockApp';
import { SettingsApp } from '../shell/settings/SettingsApp';

export interface AppDefinition {
  id: string;
  name: string;
  category: 'System' | 'Utilities' | 'Productivity' | 'Entertainment' | 'Development' | 'Creative';
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
    id: 'paint',
    name: 'Paint Studio',
    category: 'Creative',
    icon: PenTool,
    iconColor: '#38bdf8',
    description: 'Layered raster graphics painting studio with filters and image export.',
    version: '2.0.0',
    keywords: ['paint', 'art', 'draw', 'raster', 'brush', 'photo'],
    defaultBounds: { width: 920, height: 600 },
    showOnDesktop: true,
    isPinnedToTaskbar: false,
    isFavorite: true,
    component: PaintApp,
  },
  {
    id: 'pdf-viewer',
    name: 'Document Reader',
    category: 'Productivity',
    icon: FileText,
    iconColor: '#f87171',
    description: 'PDF and rich text document inspector with full-text search and bookmarks.',
    version: '2.0.0',
    keywords: ['pdf', 'doc', 'reader', 'document', 'viewer', 'books'],
    defaultBounds: { width: 880, height: 580 },
    showOnDesktop: false,
    isPinnedToTaskbar: false,
    isFavorite: false,
    component: PdfViewerApp,
  },
  {
    id: 'video-player',
    name: 'Cinema Video',
    category: 'Entertainment',
    icon: Film,
    iconColor: '#fb923c',
    description: 'High-definition video playback engine with seek scrubbing and speed controls.',
    version: '2.0.0',
    keywords: ['video', 'movie', 'film', 'clip', 'cinema', 'player'],
    defaultBounds: { width: 800, height: 520 },
    showOnDesktop: false,
    isPinnedToTaskbar: false,
    isFavorite: false,
    component: VideoPlayerApp,
  },
  {
    id: 'daw',
    name: 'Audio Workstation',
    category: 'Creative',
    icon: Music,
    iconColor: '#a855f7',
    description: '16-step beat sequencer and analog synthesizer filter rack.',
    version: '2.0.0',
    keywords: ['daw', 'music', 'synth', 'beat', 'drums', 'audio', 'sequencer'],
    defaultBounds: { width: 860, height: 540 },
    showOnDesktop: false,
    isPinnedToTaskbar: false,
    isFavorite: true,
    component: AudioWorkstationApp,
  },
  {
    id: 'games',
    name: 'Game Center',
    category: 'Entertainment',
    icon: Gamepad2,
    iconColor: '#eab308',
    description: 'Classic arcade gaming suite with Minesweeper, 2048, and Snake.',
    version: '2.0.0',
    keywords: ['game', 'arcade', 'minesweeper', '2048', 'snake', 'play'],
    defaultBounds: { width: 780, height: 500 },
    showOnDesktop: true,
    isPinnedToTaskbar: false,
    isFavorite: true,
    component: GameCenterApp,
  },
  {
    id: 'weather',
    name: 'Weather',
    category: 'Utilities',
    icon: Sun,
    iconColor: '#38bdf8',
    description: 'Live atmospheric weather forecast, humidity, wind, and 7-day outlook.',
    version: '2.0.0',
    keywords: ['weather', 'forecast', 'temperature', 'climate', 'sun', 'rain'],
    defaultBounds: { width: 620, height: 480 },
    showOnDesktop: false,
    isPinnedToTaskbar: false,
    isFavorite: true,
    component: WeatherApp,
  },
  {
    id: 'clock',
    name: 'Clock & Timer',
    category: 'Utilities',
    icon: ClockIcon,
    iconColor: '#34d399',
    description: 'Global world timezones, precision stopwatch with laps, and countdown timer.',
    version: '2.0.0',
    keywords: ['clock', 'time', 'stopwatch', 'timer', 'alarm', 'timezone'],
    defaultBounds: { width: 600, height: 440 },
    showOnDesktop: false,
    isPinnedToTaskbar: false,
    isFavorite: false,
    component: ClockApp,
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
