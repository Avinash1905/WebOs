export type AnnouncePoliteness = 'polite' | 'assertive';

export interface AnnouncementMessage {
  id: string;
  text: string;
  politeness: AnnouncePoliteness;
  timestamp: number;
}
