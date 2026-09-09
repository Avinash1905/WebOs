import { create } from 'zustand';
import type { ShortcutDefinition, ShortcutConflict } from '../keyboard/shortcutTypes';
import { shortcutEngine } from '../keyboard/shortcutEngine';

const STORAGE_KEY = 'webos_shortcut_customizations';

interface PersistedCustomization {
  overrides?: Record<string, string>; // id -> customCombo
  disabledIds?: string[];
}

const loadCustomizations = (): PersistedCustomization => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // fallback
  }
  return {};
};

const saveCustomizations = (data: PersistedCustomization) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
};

const initialData = loadCustomizations();
if (initialData.overrides) {
  Object.entries(initialData.overrides).forEach(([id, combo]) => {
    shortcutEngine.updateShortcutCombo(id, combo);
  });
}
if (initialData.disabledIds) {
  initialData.disabledIds.forEach((id) => {
    shortcutEngine.setShortcutEnabled(id, false);
  });
}

interface ShortcutStoreState {
  shortcuts: ShortcutDefinition[];
  activeConflict: ShortcutConflict | null;

  refreshShortcuts: () => void;
  updateCombo: (id: string, newCombo: string) => { success: boolean; conflict?: ShortcutConflict };
  toggleEnabled: (id: string) => void;
  resetAll: () => void;
  clearConflict: () => void;
}

export const useShortcutStore = create<ShortcutStoreState>((set, get) => ({
  shortcuts: shortcutEngine.getAllShortcuts(),
  activeConflict: null,

  refreshShortcuts: () => {
    set({ shortcuts: shortcutEngine.getAllShortcuts() });
  },

  updateCombo: (id, newCombo) => {
    const result = shortcutEngine.updateShortcutCombo(id, newCombo);
    if (result.success) {
      get().refreshShortcuts();
      set({ activeConflict: null });

      const overrides: Record<string, string> = {};
      shortcutEngine.getAllShortcuts().forEach((s) => {
        if (s.currentCombo !== s.defaultCombo) {
          overrides[s.id] = s.currentCombo;
        }
      });
      saveCustomizations({ overrides });
    } else if (result.conflict) {
      set({ activeConflict: result.conflict });
    }
    return result;
  },

  toggleEnabled: (id) => {
    const target = shortcutEngine.getShortcut(id);
    if (!target) return;
    const next = !target.isEnabled;
    shortcutEngine.setShortcutEnabled(id, next);
    get().refreshShortcuts();

    const disabledIds = shortcutEngine
      .getAllShortcuts()
      .filter((s) => !s.isEnabled)
      .map((s) => s.id);
    saveCustomizations({ disabledIds });
  },

  resetAll: () => {
    shortcutEngine.resetToDefaults();
    saveCustomizations({});
    set({ shortcuts: shortcutEngine.getAllShortcuts(), activeConflict: null });
  },

  clearConflict: () => {
    set({ activeConflict: null });
  },
}));
