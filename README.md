# WebOS

A modern, high-performance browser-based operating system built with React 19, TypeScript, and Vite.

## Architecture & Responsibilities
- **Member 1**: Desktop Environment & UI System (Shell, Taskbar, System Tray, Window Container, UI Component Library, Themes)
- **Member 2**: OS Core & Kernel Services (Process tree, File system, IPC, Event bus)
- **Member 3**: Applications & Ecosystem (Terminal, File Manager, Browser, Text Editor, Settings)
- **Member 4**: Backend & Cloud Sync (User authentication, Remote persistence, Sync)

## Member 1 Implementation: Phase 1 — Foundation + Desktop Shell
- **Desktop Shell**: Viewport surface, ambient canvas, wallpaper manager, grid positioning, single/multi icon selection, keyboard arrow navigation.
- **Taskbar & System Tray**: Start button, taskbar application area with active indicators, system tray with Network/Audio/Battery/Notification metrics, live formatted clock.
- **Window Container**: Multi-window container, titlebar controls (minimize, maximize/restore, close), focus elevation, responsive bounds.
- **UI Components**: Reusable `Button`, `IconButton`, `Tooltip`, `Panel`, `Badge`, `Input`, `Dropdown`, `ContextMenu`, `Separator`.
- **Theme Engine**: CSS variables, Acrylic glassmorphic blur, elevation shadows, dynamic wallpapers.
- **Contracts**: Typed boundaries for Members 2, 3, and 4 in `src/contracts/`.

## Getting Started

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

### Run Tests
```bash
npm run test
```

### Build Production Bundle
```bash
npm run build
```
