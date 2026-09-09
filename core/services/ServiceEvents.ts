/**
 * @file ServiceEvents.ts
 * @description Standard event names for WebOS System Services.
 */

export const SERVICE_EVENTS = {
  SERVICE_REGISTERED: 'service.registered',
  SERVICE_UNREGISTERED: 'service.unregistered',
  SERVICE_STARTING: 'service.starting',
  SERVICE_STARTED: 'service.started',
  SERVICE_PAUSED: 'service.paused',
  SERVICE_RESUMED: 'service.resumed',
  SERVICE_STOPPING: 'service.stopping',
  SERVICE_STOPPED: 'service.stopped',
  SERVICE_FAILED: 'service.failed',
  SERVICE_RESTARTED: 'service.restarted',
  SERVICE_HEALTH_CHANGED: 'service.healthChanged',
} as const;

export type ServiceEventType = (typeof SERVICE_EVENTS)[keyof typeof SERVICE_EVENTS];
