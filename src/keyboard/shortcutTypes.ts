export type ShortcutCategory =
  | 'System'
  | 'Window Management'
  | 'Navigation'
  | 'Applications'
  | 'Accessibility';

export interface ShortcutDefinition {
  id: string;
  name: string;
  description: string;
  category: ShortcutCategory;
  defaultCombo: string; // e.g., 'Alt+Tab', 'Meta+D', 'Ctrl+Space'
  currentCombo: string;
  isEnabled: boolean;
  isCustomizable: boolean;
  action: () => void;
}

export interface ShortcutConflict {
  shortcutA: ShortcutDefinition;
  shortcutB: ShortcutDefinition;
  conflictingCombo: string;
}
