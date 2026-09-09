/**
 * @file MetadataSearchFilter.ts
 * @description Advanced multi-criteria search predicate evaluator for WebOS resources.
 */

export interface SearchableResource {
  readonly id: string;
  readonly path: string;
  readonly size: number;
  readonly createdAt: number;
  readonly modifiedAt: number;
  readonly mimeType: string;
  readonly owner: string;
  readonly tags?: readonly string[];
}

export interface ResourceSearchQuery {
  readonly pathPrefix?: string;
  readonly minSize?: number;
  readonly maxSize?: number;
  readonly modifiedAfter?: number;
  readonly modifiedBefore?: number;
  readonly mimeType?: string;
  readonly owner?: string;
  readonly requiredTags?: readonly string[];
}

export class MetadataSearchFilter {
  public static filter(resources: readonly SearchableResource[], query: ResourceSearchQuery): SearchableResource[] {
    return resources.filter((res) => {
      if (query.pathPrefix && !res.path.startsWith(query.pathPrefix)) return false;
      if (query.minSize !== undefined && res.size < query.minSize) return false;
      if (query.maxSize !== undefined && res.size > query.maxSize) return false;
      if (query.modifiedAfter !== undefined && res.modifiedAt < query.modifiedAfter) return false;
      if (query.modifiedBefore !== undefined && res.modifiedAt > query.modifiedBefore) return false;
      if (query.mimeType && res.mimeType !== query.mimeType) return false;
      if (query.owner && res.owner !== query.owner) return false;

      if (query.requiredTags && query.requiredTags.length > 0) {
        if (!res.tags) return false;
        for (const tag of query.requiredTags) {
          if (!res.tags.includes(tag)) return false;
        }
      }

      return true;
    });
  }
}
