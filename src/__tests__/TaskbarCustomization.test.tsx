import { describe, it, expect } from 'vitest';
import { useTaskbarCustomStore } from '../stores/taskbarCustomStore';

describe('Taskbar Customization & Preferences', () => {
  it('updates taskbar position and alignment', () => {
    const store = useTaskbarCustomStore.getState();

    store.setPosition('top');
    expect(useTaskbarCustomStore.getState().position).toBe('top');

    store.setAlignment('left');
    expect(useTaskbarCustomStore.getState().alignment).toBe('left');

    store.setPosition('bottom');
    store.setAlignment('center');
  });

  it('toggles 24-hour clock and seconds format', () => {
    const store = useTaskbarCustomStore.getState();

    store.toggleClock24Hour();
    expect(useTaskbarCustomStore.getState().clock24Hour).toBe(true);

    store.toggleShowSeconds();
    expect(useTaskbarCustomStore.getState().showSeconds).toBe(true);
  });
});
