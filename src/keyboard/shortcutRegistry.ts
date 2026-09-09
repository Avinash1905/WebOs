export interface ShortcutDefinition {
  id: string;
  name: string;
  keyCombo: string;
  description: string;
}

export const SYSTEM_SHORTCUTS: ShortcutDefinition[] = [
  { id: 'alt-tab', name: 'Task Switcher', keyCombo: 'Alt + Tab', description: 'Cycle through running applications' },
  { id: 'alt-f4', name: 'Close Window', keyCombo: 'Alt + F4', description: 'Close the active focused window' },
  { id: 'win-d', name: 'Show Desktop', keyCombo: 'Meta + D / Alt + D', description: 'Minimize or restore all windows' },
  { id: 'win-up', name: 'Maximize Window', keyCombo: 'Meta + ArrowUp', description: 'Maximize or restore active window' },
  { id: 'win-down', name: 'Minimize Window', keyCombo: 'Meta + ArrowDown', description: 'Minimize active window' },
  { id: 'win-left', name: 'Snap Left', keyCombo: 'Meta + ArrowLeft', description: 'Snap active window to the left half' },
  { id: 'win-right', name: 'Snap Right', keyCombo: 'Meta + ArrowRight', description: 'Snap active window to the right half' },
  { id: 'escape', name: 'Dismiss', keyCombo: 'Escape', description: 'Close active popovers, context menus, and Start Menu' },
];
