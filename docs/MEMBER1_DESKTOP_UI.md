# Member 1: Desktop Environment & UI System Documentation

## Overview
Member 1 is responsible for the visual desktop environment, taskbar, system tray, window container shell, theme system, and shared reusable UI component library for WebOS.

---

## 1. Desktop Shell Architecture
The desktop shell runs as the foundation layer (`src/shell/desktop/`):
- **`DesktopShell`**: Manages the full browser viewport, background wallpaper renderer, ambient gradient backdrop, and layers foreground windows and taskbar.
- **`DesktopSurface`**: Handles click interactions, desktop-level context menus (Refresh, New Folder, Wallpaper switch, Display settings), and icon grid arrangement.
- **`DesktopGrid`**: Responsive CSS grid that hosts desktop icons with arrow-key keyboard navigation (`Up`, `Down`, `Home`, `End`).
- **`DesktopIcon`**: Accessible desktop icon supporting single-click select, double-click launch, Enter/Space launch, badge counts, custom icon colors, and right-click context menus.

---

## 2. Taskbar & System Tray
Located at `src/shell/taskbar/`:
- **`Taskbar`**: Glassmorphic pinned footer supporting both `bottom` and `top` dock placements.
- **`StartButton`**: WebOS styled logo button with active state and keyboard accessibility.
- **`TaskbarAppArea`**: Displays running application items with focus pills, minimized state indicators, and window toggle actions.
- **`SystemTray`**: Real-time status indicators for Network (Wi-Fi), Audio (Volume/Mute toggle), Battery status, and Notification Center with unread badges.
- **`Clock`**: Live digital clock with formatted date and detailed full-date hover tooltips.

---

## 3. Window Container Foundation
Located at `src/shell/window/`:
- **`WindowContainer`**: Reusable application window host container.
- **`WindowTitleBar`**: Application icon, title text, and controls (`Minimize`, `Maximize` / `Restore`, `Close`). Supports double-click to maximize/restore.
- **`WindowContent`**: Sandboxed scrollable application viewport.
- **State Management**: Zustand store (`useWindowStore`) handles z-index elevation, focus switching, minimizing, and cascading placement.

---

## 4. Shared UI Component Library
Located at `src/ui/`:
- **`Button`**: Variants (`primary`, `secondary`, `ghost`, `danger`, `outline`), loading spinner, icon slots.
- **`IconButton`**: Accessible icon button with tooltips and active states.
- **`Tooltip`**: Micro-animated hover/focus tooltip with multi-directional anchoring (`top`, `bottom`, `left`, `right`).
- **`Panel`**: Acrylic blurred glassmorphic surface panel with customizable radii and elevations.
- **`Badge`**: Status badge and notification count pill (`primary`, `secondary`, `success`, `warning`, `danger`, `dot`).
- **`Input`**: Text input with icon slots and active glow borders.
- **`Dropdown`**: Popover menu with keyboard and outside-click dismissal.
- **`ContextMenu`**: Fixed-position context menu with boundary safety checks and Escape key listener.
- **`Separator`**: Semantic horizontal/vertical line divider.

---

## 5. Integration Contracts & Boundaries

### Member 2 (OS Core) Boundary — `src/contracts/osCore.ts`
Member 1 accesses OS Core through `IOSCoreService`:
```typescript
export interface IOSCoreService {
  launchApplication(appId: string, args?: Record<string, unknown>): Promise<{ pid: number; success: boolean }>;
  terminateProcess(pid: number): Promise<boolean>;
  getRunningProcesses(): Promise<ProcessInfo[]>;
  getFileSystem(): Promise<FileSystemNode[]>;
  subscribeToSystemEvents(listener: (event: SystemEventPayload) => void): () => void;
}
```

### Member 3 (Applications) Boundary — `src/contracts/appRegistry.ts`
Member 3 registers applications into WebOS via `appRegistry`:
```typescript
appRegistry.registerApplication({
  id: 'my-app',
  name: 'My Application',
  category: 'Productivity',
  icon: MyAppIcon,
  showOnDesktop: true,
  isPinnedToTaskbar: true,
  component: MyAppView
});
```

### Member 4 (Backend / Persistence) Boundary — `src/contracts/backend.ts`
Member 1 synchronizes settings and notifications via `IBackendSyncService`:
```typescript
export interface IBackendSyncService {
  getUserProfile(): Promise<UserProfile>;
  loadPreferences(): Promise<Partial<UIPreferences>>;
  savePreferences(prefs: Partial<UIPreferences>): Promise<boolean>;
  getNotifications(): Promise<SystemNotification[]>;
}
```

---

## 6. Testing & Quality Assurance
Run tests:
```bash
npm run test
```
All components are tested with Vitest and `@testing-library/react`.
