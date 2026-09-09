# Member 1: Desktop Environment & UI System Documentation

## Overview
Member 1 is responsible for the visual desktop environment, UI infrastructure, window manager, taskbar, Start Menu, Application Launcher, themes, and shared reusable component library for WebOS.

---

## 1. Window Manager Subsystem (`src/wm/`)

### Architecture
- **`WindowManager`**: Renders all open application window instances according to their dynamic `zIndex` layering, mounts the active `SnapPreview` overlay, and integrates the `AltTabSwitcher`.
- **`useWindowDrag`**: High-performance pointer capture dragging engine with smooth coordinate updates, viewport boundary clamping, and proximity detection for edge/corner snap zones.
- **`useWindowResize`**: 8-direction resize hook (`n`, `s`, `e`, `w`, `ne`, `nw`, `se`, `sw`) enforcing minimum width (320px) and height (200px) constraints without layout jumping.
- **`SnapPreview`**: Translucent acrylic overlay displaying real-time snap boundaries when dragging windows near viewport edges.
- **`WindowGeometry`**: Core mathematical utilities for geometry preservation, viewport boundary clamping, and restore state management.

### Window States & Lifecycle
- `normal`: Floating, draggable, and resizable window with custom bounds.
- `maximized`: Full viewport display (accounting for taskbar height).
- `fullscreen`: True WebOS window fullscreen mode covering the entire viewport (`100vw x 100vh`).
- `snapped-left` / `snapped-right`: 50% split screen tiling.
- `snapped-top-left` / `snapped-top-right` / `snapped-bottom-left` / `snapped-bottom-right`: Quarter screen corner snapping.
- `minimized`: Window hidden from desktop, represented with active pills on the taskbar.

---

## 2. Desktop Navigation & Start Menu (`src/shell/startmenu/`)

- **`StartMenu`**: Floating glassmorphic acrylic menu anchored above the taskbar Start button.
- **`StartMenuHeader`**: Displays current active user profile, status badge, role, and quick settings trigger.
- **`StartMenuSearch`**: Live fuzzy search indexing application names, descriptions, categories, and keyword aliases.
- **`StartMenuPinned`**: Grid of pinned applications with customized color themes and launch triggers.
- **`StartMenuAllApps`**: Alphabetical and categorized listing of all registered applications.
- **`StartMenuRecent`**: Recently modified documents and activities.
- **`StartMenuFooter`**: Quick power controls (Lock Screen, Sign Out, Restart WebOS, Shut Down).

---

## 3. Application Launcher / Launchpad (`src/shell/launcher/`)

- **`AppLauncher`**: Full-screen modal launchpad view with dark blur backdrop.
- **`LauncherFilter`**: Category filtering (`All`, `Favorites`, `System`, `Productivity`, `Development`, `Utilities`) and Grid / List view mode switcher.
- **`LauncherGrid`**: High-res card grid with favorite star toggling and hover micro-animations.
- **`LauncherList`**: Detailed table view displaying version badges, metadata, and quick launch actions.

---

## 4. Enhanced Taskbar & Application Grouping (`src/shell/taskbar/`)

- **Application Grouping**: Automatically groups multiple window instances of the same application under a single taskbar button with count badges.
- **Running & Focused Indicators**: Shows active pill beneath focused window and running dots for open background apps.
- **Taskbar Context Menu**: Right-click menu providing `Open`, `New Window`, `Pin / Unpin to Taskbar`, `Close Window`, and `Close All (N)` actions.
- **Launcher Trigger**: Dedicated rocket button for instant Launchpad access.

---

## 5. Global Keyboard Window Management (`src/keyboard/`)

| Shortcut | Action |
| :--- | :--- |
| `Alt + Tab` | Cycles through open running applications via interactive overlay modal |
| `Alt + F4` | Closes the currently active focused window |
| `Win + D` / `Alt + D` | Shows / Hides desktop (minimizes or restores all open windows) |
| `Win + Up` | Maximizes the active focused window |
| `Win + Down` | Restores or minimizes the active focused window |
| `Win + Left` | Snaps active window to the left 50% viewport split |
| `Win + Right` | Snaps active window to the right 50% viewport split |
| `Escape` | Dismisses active menus, Start Menu, Launchpad, and Alt-Tab switcher |

---

## 6. Application Integration Contract (`src/contracts/appRegistry.ts`)

Member 3 applications integrate with WebOS by registering their app manifest:
```typescript
import { appRegistry } from './contracts/appRegistry';

appRegistry.registerApplication({
  id: 'my-app',
  name: 'My Custom App',
  category: 'Productivity',
  icon: MyIcon,
  iconColor: '#38bdf8',
  description: 'Application description...',
  version: '1.0.0',
  defaultBounds: { width: 800, height: 500 },
  showOnDesktop: true,
  isPinnedToTaskbar: true,
  component: MyAppComponent,
});
```

---

## 7. Testing & Verification

Run all test suites:
```bash
npm run test
```
All 11 test suites and 44 tests pass with 100% success.
