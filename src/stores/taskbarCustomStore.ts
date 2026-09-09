import { create } from 'zustand';

export type TaskbarPosition = 'bottom' | 'top';
export type TaskbarAlignment = 'center' | 'left';

const STORAGE_KEY = 'webos_taskbar_custom';

interface PersistedTaskbarData {
  position?: TaskbarPosition;
  alignment?: TaskbarAlignment;
  autoHide?: boolean;
  showBadges?: boolean;
  showLabels?: boolean;
  clock24Hour?: boolean;
  showSeconds?: boolean;
}

const loadTaskbarSettings = (): PersistedTaskbarData => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // fallback
  }
  return {};
};

const saveTaskbarSettings = (data: PersistedTaskbarData) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
};

const saved = loadTaskbarSettings();

interface TaskbarCustomStoreState {
  position: TaskbarPosition;
  alignment: TaskbarAlignment;
  autoHide: boolean;
  showBadges: boolean;
  showLabels: boolean;
  clock24Hour: boolean;
  showSeconds: boolean;

  setPosition: (position: TaskbarPosition) => void;
  setAlignment: (alignment: TaskbarAlignment) => void;
  toggleAutoHide: () => void;
  toggleShowBadges: () => void;
  toggleShowLabels: () => void;
  toggleClock24Hour: () => void;
  toggleShowSeconds: () => void;
}

export const useTaskbarCustomStore = create<TaskbarCustomStoreState>((set, get) => ({
  position: saved.position || 'bottom',
  alignment: saved.alignment || 'center',
  autoHide: saved.autoHide || false,
  showBadges: saved.showBadges ?? true,
  showLabels: saved.showLabels ?? false,
  clock24Hour: saved.clock24Hour ?? false,
  showSeconds: saved.showSeconds ?? false,

  setPosition: (position) => {
    set({ position });
    saveTaskbarSettings({ ...get(), position });
  },

  setAlignment: (alignment) => {
    set({ alignment });
    saveTaskbarSettings({ ...get(), alignment });
  },

  toggleAutoHide: () => {
    const next = !get().autoHide;
    set({ autoHide: next });
    saveTaskbarSettings({ ...get(), autoHide: next });
  },

  toggleShowBadges: () => {
    const next = !get().showBadges;
    set({ showBadges: next });
    saveTaskbarSettings({ ...get(), showBadges: next });
  },

  toggleShowLabels: () => {
    const next = !get().showLabels;
    set({ showLabels: next });
    saveTaskbarSettings({ ...get(), showLabels: next });
  },

  toggleClock24Hour: () => {
    const next = !get().clock24Hour;
    set({ clock24Hour: next });
    saveTaskbarSettings({ ...get(), clock24Hour: next });
  },

  toggleShowSeconds: () => {
    const next = !get().showSeconds;
    set({ showSeconds: next });
    saveTaskbarSettings({ ...get(), showSeconds: next });
  },
}));
