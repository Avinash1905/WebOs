# WebOS

A modern, high-performance browser-based operating system built with React 19, TypeScript, and Vite.

## Architecture & Responsibilities
- **Member 1**: Desktop Environment & UI System (Desktop Shell, Window Manager, Taskbar, Start Menu, Application Launcher, UI Component Library, Theme Engine)
- **Member 2**: OS Core & Kernel Services (Process tree, File system, IPC, Event bus)
- **Member 3**: Applications & Ecosystem (Terminal, File Manager, Browser, Text Editor, Settings)
- **Member 4**: Backend & Cloud Sync (User authentication, Remote persistence, Sync)

## Phase 2 Capabilities (Window Manager & Desktop Navigation)
- **Full Window Manager**: Pointer dragging, 8-direction resizing, boundary constraints, quarter/half snap zones, live snap preview, fullscreen mode, z-index elevation, and geometry restoration.
- **Start Menu**: User profile section, live fuzzy search, pinned apps grid, all-apps categorized list, recent items, and power action controls.
- **Launchpad / Application Launcher**: Fullscreen application launcher with category filters (`All`, `Favorites`, `System`, `Productivity`, `Development`, `Utilities`) and Grid/List view switchers.
- **Taskbar with App Grouping**: Application grouping by ID with count badges, running pills, and right-click context menu (`Open`, `New Window`, `Pin/Unpin`, `Close`, `Close All`).
- **Global Keyboard Shortcuts**: `Alt+Tab` task switcher, `Alt+F4` close window, `Win+D` show desktop, and `Win+Arrows` window tile snapping.
- **Testing**: 11 test suites with 44 unit & integration tests (`npm run test`).

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
