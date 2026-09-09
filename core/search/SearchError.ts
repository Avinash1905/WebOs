/**
 * @file SearchError.ts
 * @description Typed error hierarchy for the WebOS Search Engine.
 */

export class SearchError extends Error {
  public readonly code: string;
  public readonly timestamp: number;

  constructor(message: string, code = 'SEARCH_ERROR') {
    super(message);
    this.name = 'SearchError';
    this.code = code;
    this.timestamp = Date.now();
  }
}

export class InvalidSearchQueryError extends SearchError {
  constructor(details: string) {
    super('Invalid search query: ' + details, 'INVALID_SEARCH_QUERY');
    this.name = 'InvalidSearchQueryError';
  }
}

export class SearchPermissionError extends SearchError {
  constructor(path: string, userId?: string) {
    super(
      'Search permission denied on path \'' + path + '\'' +
        (userId ? ' for user \'' + userId + '\'' : ''),
      'SEARCH_PERMISSION_DENIED'
    );
    this.name = 'SearchPermissionError';
  }
}

export class SearchIndexError extends SearchError {
  constructor(details: string) {
    super('Search indexing error: ' + details, 'SEARCH_INDEX_ERROR');
    this.name = 'SearchIndexError';
  }
}
