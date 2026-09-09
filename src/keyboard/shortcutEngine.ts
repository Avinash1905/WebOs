import type { ShortcutDefinition, ShortcutConflict } from './shortcutTypes';
import { createDefaultShortcuts } from './defaultShortcuts';

export class ShortcutEngine {
  private shortcuts: Map<string, ShortcutDefinition> = new Map();

  constructor() {
    this.resetToDefaults();
  }

  resetToDefaults(): void {
    this.shortcuts.clear();
    const defaults = createDefaultShortcuts();
    defaults.forEach((s) => this.shortcuts.set(s.id, s));
  }

  getAllShortcuts(): ShortcutDefinition[] {
    return Array.from(this.shortcuts.values());
  }

  getShortcut(id: string): ShortcutDefinition | undefined {
    return this.shortcuts.get(id);
  }

  registerShortcut(shortcut: ShortcutDefinition): void {
    this.shortcuts.set(shortcut.id, shortcut);
  }

  unregisterShortcut(id: string): void {
    this.shortcuts.delete(id);
  }

  setShortcutEnabled(id: string, enabled: boolean): void {
    const s = this.shortcuts.get(id);
    if (s) {
      s.isEnabled = enabled;
    }
  }

  updateShortcutCombo(id: string, newCombo: string): { success: boolean; conflict?: ShortcutConflict } {
    const target = this.shortcuts.get(id);
    if (!target || !target.isCustomizable) {
      return { success: false };
    }

    const normalized = this.normalizeCombo(newCombo);

    // Conflict check
    for (const other of this.shortcuts.values()) {
      if (other.id !== id && other.isEnabled && this.normalizeCombo(other.currentCombo) === normalized) {
        return {
          success: false,
          conflict: {
            shortcutA: target,
            shortcutB: other,
            conflictingCombo: normalized,
          },
        };
      }
    }

    target.currentCombo = normalized;
    return { success: true };
  }

  normalizeCombo(combo: string): string {
    const parts = combo
      .split('+')
      .map((p) => p.trim())
      .filter(Boolean);

    const modifiers: string[] = [];
    let primaryKey = '';

    parts.forEach((p) => {
      const lower = p.toLowerCase();
      if (lower === 'ctrl' || lower === 'control') modifiers.push('Ctrl');
      else if (lower === 'alt' || lower === 'option') modifiers.push('Alt');
      else if (lower === 'shift') modifiers.push('Shift');
      else if (lower === 'meta' || lower === 'win' || lower === 'cmd' || lower === 'command') modifiers.push('Meta');
      else if (lower === 'space') primaryKey = 'Space';
      else if (lower === 'escape' || lower === 'esc') primaryKey = 'Escape';
      else if (lower.startsWith('arrow')) primaryKey = 'Arrow' + lower.slice(5).charAt(0).toUpperCase() + lower.slice(6);
      else primaryKey = p.length === 1 ? p.toUpperCase() : p.charAt(0).toUpperCase() + p.slice(1);
    });

    const orderedMods = ['Ctrl', 'Alt', 'Shift', 'Meta'].filter((m) => modifiers.includes(m));
    if (primaryKey) orderedMods.push(primaryKey);

    return orderedMods.join('+');
  }

  eventToCombo(e: KeyboardEvent): string {
    const parts: string[] = [];
    if (e.ctrlKey) parts.push('Ctrl');
    if (e.altKey) parts.push('Alt');
    if (e.shiftKey) parts.push('Shift');
    if (e.metaKey) parts.push('Meta');

    const key = e.key;
    if (!['Control', 'Alt', 'Shift', 'Meta'].includes(key)) {
      if (key === ' ') parts.push('Space');
      else if (key === 'ArrowUp') parts.push('ArrowUp');
      else if (key === 'ArrowDown') parts.push('ArrowDown');
      else if (key === 'ArrowLeft') parts.push('ArrowLeft');
      else if (key === 'ArrowRight') parts.push('ArrowRight');
      else if (key.length === 1) parts.push(key.toUpperCase());
      else parts.push(key);
    }

    return parts.join('+');
  }

  handleKeyEvent(e: KeyboardEvent): boolean {
    const eventCombo = this.eventToCombo(e);
    if (!eventCombo) return false;

    for (const shortcut of this.shortcuts.values()) {
      if (!shortcut.isEnabled) continue;

      if (this.normalizeCombo(shortcut.currentCombo) === eventCombo) {
        e.preventDefault();
        try {
          shortcut.action();
        } catch (err) {
          console.error(`Error executing shortcut ${shortcut.id}:`, err);
        }
        return true;
      }
    }

    return false;
  }
}

export const shortcutEngine = new ShortcutEngine();
