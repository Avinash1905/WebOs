# WebOS Shared UI Library & Design Tokens Catalog
**Author: MEMBER 1 — Desktop Environment & UI Platform**

---

## 1. Design Tokens & CSS Variables

All components consume semantic CSS variables injected dynamically by the `ThemeEngine`:

| Token | CSS Variable | Description |
|---|---|---|
| Surface Base | `--os-surface-base` | Primary desktop and deep background layer |
| Surface Glass | `--os-surface-glass` | Translucent glassmorphism backdrop with blur |
| Surface Elevated | `--os-surface-elevated` | Modal dialogs, context menus, and taskbar popovers |
| Surface Solid | `--os-surface-solid` | High Contrast opaque backdrop |
| Text Primary | `--os-text-primary` | High emphasis headings, titles, and labels |
| Text Secondary | `--os-text-secondary` | Medium emphasis descriptions and timestamps |
| Text Muted | `--os-text-muted` | Low emphasis helper text and hotkey shortcuts |
| Accent Primary | `--os-accent-primary` | Main interactive brand color (default: `#38bdf8`) |
| Accent Hover | `--os-accent-hover` | Interactive hover state color |
| Accent Glow | `--os-accent-glow` | Focus ring and neon drop shadow glow |
| Border Glass | `--os-border-glass` | 1px frosted translucent border |
| Density Gap | `--os-density-gap` | Layout spacing (Compact: `4px`, Comfortable: `8px`, Spacious: `12px`) |

---

## 2. Reusable UI Primitives

### 2.1 Buttons & Form Controls
- **Button**: Supports `primary`, `secondary`, `danger`, `ghost`, and `icon` variants with keyboard focus ring and active click animation.
- **Switch**: Accessible boolean toggle with `role="switch"` and `aria-checked`.
- **Slider**: Range slider with custom thumb and fill gradient.
- **Select**: Dropdown select with arrow indicator and high-contrast support.

### 2.2 Overlays & Containers
- **Dialog / Modal**: Centered modal with `FocusTrap` and backdrop blur.
- **ContextMenu**: Viewport-clamped nested context menu with keyboard navigation.
- **LiveAnnouncer**: Screen reader announcer with `polite` and `assertive` channels.
- **DragPreviewLayer**: Multi-item drag preview ghost layer with count badge.

### 2.3 Error Isolation
- **WindowErrorBoundary**: Per-application fault boundary preventing shell crashes.
