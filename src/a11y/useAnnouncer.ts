import { useAnnouncerStore } from './LiveAnnouncer';
import type { AnnouncePoliteness } from './a11yTypes';

export const useAnnouncer = () => {
  const announce = useAnnouncerStore((state) => state.announce);

  return {
    announce: (text: string, politeness: AnnouncePoliteness = 'polite') => {
      announce(text, politeness);
    },
  };
};
