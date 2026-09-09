import { create } from 'zustand';
import type { AnnouncePoliteness } from './a11yTypes';
import './a11y.css';

interface AnnouncerStoreState {
  politeMessage: string;
  assertiveMessage: string;
  announce: (text: string, politeness?: AnnouncePoliteness) => void;
}

export const useAnnouncerStore = create<AnnouncerStoreState>((set) => ({
  politeMessage: '',
  assertiveMessage: '',

  announce: (text, politeness = 'polite') => {
    if (politeness === 'assertive') {
      set({ assertiveMessage: text });
      setTimeout(() => set({ assertiveMessage: '' }), 1000);
    } else {
      set({ politeMessage: text });
      setTimeout(() => set({ politeMessage: '' }), 1000);
    }
  },
}));

export const LiveAnnouncer = () => {
  const politeMessage = useAnnouncerStore((state) => state.politeMessage);
  const assertiveMessage = useAnnouncerStore((state) => state.assertiveMessage);

  return (
    <div className="os-sr-only-container" aria-hidden="false">
      <div
        className="os-sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {politeMessage}
      </div>
      <div
        className="os-sr-only"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
      >
        {assertiveMessage}
      </div>
    </div>
  );
};
