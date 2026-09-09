export type OverlayType =
  | 'context-menu'
  | 'search'
  | 'quick-settings'
  | 'notification-center'
  | 'calendar'
  | 'start-menu'
  | 'alt-tab'
  | 'app-launcher'
  | 'modal';

export interface OverlayInstance {
  id: string;
  type: OverlayType;
  priority: number;
  onDismiss: () => void;
}

export interface OverlayStoreState {
  activeOverlays: OverlayInstance[];
  registerOverlay: (overlay: OverlayInstance) => () => void;
  dismissTopOverlay: () => boolean;
  dismissAllOverlays: () => void;
}
