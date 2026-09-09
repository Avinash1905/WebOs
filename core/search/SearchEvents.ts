/**
 * @file SearchEvents.ts
 * @description Event constants for WebOS Search operations.
 */

export const SEARCH_EVENTS = {
  SEARCH_STARTED: 'SEARCH_STARTED',
  SEARCH_COMPLETED: 'SEARCH_COMPLETED',
  SEARCH_FAILED: 'SEARCH_FAILED',
  SEARCH_INDEX_UPDATED: 'SEARCH_INDEX_UPDATED',
  SEARCH_INDEX_REBUILT: 'SEARCH_INDEX_REBUILT',
} as const;
