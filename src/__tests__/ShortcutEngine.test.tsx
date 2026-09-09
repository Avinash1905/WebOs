import { describe, it, expect, beforeEach, vi } from 'vitest';
import { shortcutEngine } from '../keyboard/shortcutEngine';
import { useShortcutStore } from '../stores/shortcutStore';

describe('Shortcut Engine & Conflict Detection', () => {
  beforeEach(() => {
    shortcutEngine.resetToDefaults();
    useShortcutStore.getState().resetAll();
  });

  it('normalizes keyboard modifier combos properly', () => {
    expect(shortcutEngine.normalizeCombo('ctrl + alt + t')).toBe('Ctrl+Alt+T');
    expect(shortcutEngine.normalizeCombo('meta + d')).toBe('Meta+D');
    expect(shortcutEngine.normalizeCombo('shift + ctrl + space')).toBe('Ctrl+Shift+Space');
  });

  it('registers and executes custom shortcuts from key events', () => {
    const mockAction = vi.fn();
    shortcutEngine.registerShortcut({
      id: 'custom-action',
      name: 'Custom Action',
      description: 'Test custom action',
      category: 'System',
      defaultCombo: 'Ctrl+Shift+K',
      currentCombo: 'Ctrl+Shift+K',
      isEnabled: true,
      isCustomizable: true,
      action: mockAction,
    });

    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      shiftKey: true,
    });

    const handled = shortcutEngine.handleKeyEvent(event);
    expect(handled).toBe(true);
    expect(mockAction).toHaveBeenCalledTimes(1);
  });

  it('detects shortcut conflicts when assigning duplicate key combinations', () => {
    // Attempt to assign 'Alt+F4' (already assigned to close-window) to spotlight-search
    const result = useShortcutStore.getState().updateCombo('spotlight-search', 'Alt+F4');
    expect(result.success).toBe(false);
    expect(result.conflict).toBeDefined();
    expect(result.conflict?.shortcutB.id).toBe('close-window');
  });

  it('allows reassigning non-conflicting shortcut combinations', () => {
    const result = useShortcutStore.getState().updateCombo('spotlight-search', 'Ctrl+Shift+P');
    expect(result.success).toBe(true);
    expect(shortcutEngine.getShortcut('spotlight-search')?.currentCombo).toBe('Ctrl+Shift+P');
  });
});
