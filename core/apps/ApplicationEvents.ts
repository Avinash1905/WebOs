/**
 * @file ApplicationEvents.ts
 * @description Application lifecycle event names.
 */

export const APPLICATION_EVENTS = {
  APP_REGISTERED: 'app:registered',
  APP_UNREGISTERED: 'app:unregistered',
  APP_INSTALLED: 'app:installed',
  APP_UNINSTALLED: 'app:uninstalled',
  APP_LAUNCHING: 'app:launching',
  APP_STARTED: 'app:started',
  APP_PAUSED: 'app:paused',
  APP_RESUMED: 'app:resumed',
  APP_STOPPING: 'app:stopping',
  APP_STOPPED: 'app:stopped',
  APP_CRASHED: 'app:crashed',
} as const;

export type ApplicationEventType = typeof APPLICATION_EVENTS[keyof typeof APPLICATION_EVENTS];
