# WebOS Desktop Environment & UI System Architecture
**Owner: MEMBER 1 — Desktop Environment & UI Platform**  
**Repository:** `Avinash1905/WebOs`  
**Branch:** `feature/member1-final`

---

## 1. Executive Summary
Member 1 is responsible for the entire visual desktop environment, interaction framework, accessibility layer, theme engine, keyboard navigation platform, overlay manager, and reusable design system for WebOS.

The desktop environment is completely decoupled from kernel scheduling (Member 2), specific user applications (Member 3), and backend persistence (Member 4), interacting strictly via high-level, typed integration contracts and adapters.

---

## 2. Subsystem Architecture Map

```
src/
├── wm/                    # Window Manager Subsystem
│   ├── WindowManager.tsx   # Z-Index Compositor & Rendering Host
│   ├── WindowGeometry.ts  # Snap zones, multi-monitor bounds, boundary clamping
│   ├── DisplayManager.ts  # Viewport dimension tracker & geometry recovery
│   └── SnapPreview.tsx    # Visual ghosting during aero-snap gestures
├── shell/                 # Desktop Shell Surfaces
│   ├── desktop/           # Desktop backdrop, multi-icon marquee selection, grid
│   ├── taskbar/           # Taskbar, App launcher pins, System Tray, Live Clock
│   ├── startmenu/         # Start menu categorized launcher & pinned apps
│   ├── launchpad/         # Fullscreen macOS/iPadOS-style Launchpad application grid
│   ├── quicksettings/     # Quick toggles (Wi-Fi, Theme, DND, Night Light, Volume)
│   ├── window/            # WindowContainer, TitleBar, Resizable frame, Action buttons
│   └── settings/          # System Preferences / Settings Application
├── theme/                 # Design Tokens & Theme Engine
│   ├── tokens.ts          # Semantic token definitions & CSS variable bindings
│   ├── themeEngine.ts     # Dynamic theme injector & runtime palette generator
│   ├── themePresets.ts    # Light, Dark, High Contrast, Cyberpunk, Nord, Solarized
│   └── wallpapers.ts      # Wallpaper catalog, gradients, and fit modes
├── keyboard/              # Keyboard Engine & Shortcuts
│   ├── shortcutEngine.ts  # Key sequence matcher, conflict detector & dispatcher
│   ├── defaultShortcuts.ts# Global WebOS shortcut catalog (Win+D, Alt+Tab, Alt+F4)
│   └── AltTabSwitcher.tsx # Interactive visual app switcher modal
├── dnd/                   # Drag and Drop Subsystem
│   ├── dndStateMachine.ts # Pointer/touch finite state machine (Idle->Drag->Drop)
│   ├── useDraggable.ts    # Drag initiator with threshold & pointer capture
│   └── DragPreviewLayer.tsx # Translucent multi-item drag preview
├── a11y/                  # Accessibility Platform
│   ├── LiveAnnouncer.tsx  # ARIA live region polite & assertive narrator
│   ├── FocusTrap.tsx      # Modal keyboard focus trap
│   └── useFocusRestoration.ts # Focus restore tracking on overlay dismissal
├── errors/                # Fault Isolation & Recovery
│   ├── ErrorBoundary.tsx  # Subsystem crash containment with retry UI
│   └── WindowErrorBoundary.tsx # Isolated per-window app crash recovery
├── contracts/             # Cross-Team Integration Adapters
│   ├── member2Adapters.ts # OS Core, Process management, VFS, Clipboard bridge
│   ├── member3Adapters.ts # Application Window SDK & App Container
│   └── member4Adapters.ts # Cloud persistence & user settings synchronization
└── stores/                # Zustand Reactive State Stores
```

---

## 3. Core Subsystems

### 3.1 Window Manager & Geometry Recovery
- **Z-Index Layering**: Dynamic z-index allocation ensuring active windows, snap previews, context menus, and modals strictly obey the overlay hierarchy.
- **Aero-Snap Engine**: Multi-zone snapping (Left 50%, Right 50%, Top Maximized, Bottom 50%, 4 Corners Quad-Tiling) triggered via dragging to edge thresholds or keyboard shortcuts (`Win + Left/Right/Up/Down`).
- **DisplayManager**: Tracks viewport dimensions across browser resize events and multi-resolution display scales (`1280x720`, `1920x1080`, 4K, ultrawide, tablet). Automatically clamps off-screen windows and recalculates cascade and tile layouts.

### 3.2 Desktop Shell & Marquee Selection
- Multi-icon selection via rubberband lasso box or `Shift/Ctrl + Click`.
- Automatic grid alignment and snap-to-grid calculations (96x96 default cell matrix).
- Desktop context menu with sorting (by Name, Type, Date), refresh, and appearance shortcuts.

### 3.3 Taskbar & Start Menu
- Configurable docking position (Top / Bottom / Left / Right) and alignment (Center / Left).
- Application grouping with running process indicators, active focus states, and minimized badges.
- System Tray with real-time clock (12/24hr format), notification counter, network indicator, and Quick Settings toggle.

### 3.4 Theme Engine & Customization
- Dynamic CSS Variable injection supporting 6 built-in presets: Dark, Light, High Contrast (WCAG AAA compliant), Cyberpunk Neon, Nord Frost, Solarized.
- Density scaling: `Compact` (4px gaps), `Comfortable` (8px gaps), `Spacious` (12px gaps).
- Customizable accent colors with real-time glow and hover variant computation.

### 3.5 Keyboard Shortcut Engine & Alt+Tab
- Typed shortcut definitions with conflict detection and customizable user key bindings.
- Built-in shortcuts:
  - `Win + D` / `Win + M`: Toggle Show Desktop.
  - `Alt + Tab` / `Alt + Shift + Tab`: Cycle active applications with visual preview.
  - `Alt + F4`: Close active window.
  - `Ctrl + Space`: Spotlight search launcher.
  - `Win + S`: Open Settings.

### 3.6 Accessibility (WCAG 2.1 AA/AAA)
- Full keyboard-only operability across all shell surfaces, menus, modals, and window management.
- Live ARIA screen-reader announcements via `LiveAnnouncer`.
- Focus containment via `FocusTrap` and automatic focus return via `useFocusRestoration`.
- First-class support for `prefers-reduced-motion` and High Contrast styling.
