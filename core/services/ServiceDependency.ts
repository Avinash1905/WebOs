/**
 * @file ServiceDependency.ts
 * @description Topological sorting and cycle detection for System Services.
 */

import {
  CircularServiceDependencyError,
  MissingServiceDependencyError,
} from './ServiceError.js';
import type { SystemService } from './types.js';

export class ServiceDependencyResolver {
  public static resolveStartupOrder(services: SystemService[]): SystemService[] {
    const serviceMap = new Map<string, SystemService>();
    for (const s of services) {
      serviceMap.set(s.id, s);
    }

    const visited = new Set<string>();
    const visiting = new Set<string>();
    const order: SystemService[] = [];

    function visit(service: SystemService, branch: string[]): void {
      const id = service.id;
      if (visited.has(id)) return;

      if (visiting.has(id)) {
        throw new CircularServiceDependencyError([...branch, id]);
      }

      visiting.add(id);
      const currentBranch = [...branch, id];

      const required = service.dependencies ?? [];
      for (const depId of required) {
        const depService = serviceMap.get(depId);
        if (!depService) {
          throw new MissingServiceDependencyError(id, depId);
        }
        visit(depService, currentBranch);
      }

      const optional = service.optionalDependencies ?? [];
      for (const depId of optional) {
        const depService = serviceMap.get(depId);
        if (depService) {
          visit(depService, currentBranch);
        }
      }

      visiting.delete(id);
      visited.add(id);
      order.push(service);
    }

    for (const service of services) {
      if (!visited.has(service.id)) {
        visit(service, []);
      }
    }

    return order;
  }

  public static resolveShutdownOrder(services: SystemService[]): SystemService[] {
    const startupOrder = this.resolveStartupOrder(services);
    return [...startupOrder].reverse();
  }
}
