/**
 * @file ServiceDependency.ts
 * @description Dependency validation, topological sorting, and cycle detection for WebOS services.
 */

import { CircularDependencyError, MissingDependencyError } from './KernelError.js';
import type { SystemService } from './Service.js';

/**
 * Validates and resolves the dependency order for a collection of WebOS system services.
 */
export class ServiceDependencyResolver {
  /**
   * Validates that all required dependencies exist and that no circular dependencies exist.
   *
   * @param services - Array of system services to validate.
   * @throws {MissingDependencyError} If a required dependency is not present.
   * @throws {CircularDependencyError} If a circular dependency is detected.
   */
  public static validate(services: readonly SystemService[]): void {
    this.validateMissingDependencies(services);
    this.detectCircularDependencies(services);
  }

  /**
   * Resolves the startup order (topological order) for the given services.
   * Dependencies are guaranteed to appear before dependent services.
   *
   * @param services - Array of system services to sort.
   * @returns Services ordered in their correct startup sequence.
   * @throws {MissingDependencyError} If a required dependency is missing.
   * @throws {CircularDependencyError} If a circular dependency is detected.
   */
  public static resolveStartupOrder(services: readonly SystemService[]): SystemService[] {
    this.validate(services);

    const serviceMap = new Map<string, SystemService>();
    for (const service of services) {
      serviceMap.set(service.name, service);
    }

    // inDegree counts how many prerequisites a service still needs
    const inDegree = new Map<string, number>();
    // dependentsMap maps serviceName -> list of services that depend on it
    const dependentsMap = new Map<string, string[]>();

    for (const service of services) {
      inDegree.set(service.name, 0);
      dependentsMap.set(service.name, []);
    }

    for (const service of services) {
      const activeDeps = this.getActiveDependencies(service, serviceMap);
      inDegree.set(service.name, activeDeps.length);

      for (const depName of activeDeps) {
        const list = dependentsMap.get(depName);
        if (list) {
          list.push(service.name);
        }
      }
    }

    // Queue nodes with 0 in-degree (no prerequisites)
    const queue: string[] = [];
    for (const [name, degree] of inDegree.entries()) {
      if (degree === 0) {
        queue.push(name);
      }
    }

    const orderedNames: string[] = [];

    while (queue.length > 0) {
      const current = queue.shift()!;
      orderedNames.push(current);

      const dependents = dependentsMap.get(current) ?? [];
      for (const dependent of dependents) {
        const currentDegree = inDegree.get(dependent) ?? 0;
        const newDegree = currentDegree - 1;
        inDegree.set(dependent, newDegree);
        if (newDegree === 0) {
          queue.push(dependent);
        }
      }
    }

    if (orderedNames.length !== services.length) {
      // If graph has a cycle that somehow wasn't caught earlier
      this.detectCircularDependencies(services);
    }

    return orderedNames.map((name) => serviceMap.get(name)!);
  }

  /**
   * Resolves the shutdown order for the given services.
   * Dependent services appear before their dependencies (reverse of startup order).
   *
   * @param services - Array of system services.
   * @returns Services ordered in their correct shutdown sequence.
   */
  public static resolveShutdownOrder(services: readonly SystemService[]): SystemService[] {
    const startupOrder = this.resolveStartupOrder(services);
    return [...startupOrder].reverse();
  }

  /**
   * Checks for missing required dependencies.
   */
  private static validateMissingDependencies(services: readonly SystemService[]): void {
    const registeredNames = new Set(services.map((s) => s.name));

    for (const service of services) {
      const deps = service.dependencies ?? [];
      for (const dep of deps) {
        if (!registeredNames.has(dep)) {
          throw new MissingDependencyError(service.name, dep);
        }
      }
    }
  }

  /**
   * Detects cycles in the service dependency graph using DFS with cycle path reconstruction.
   */
  private static detectCircularDependencies(services: readonly SystemService[]): void {
    const serviceMap = new Map<string, SystemService>();
    for (const service of services) {
      serviceMap.set(service.name, service);
    }

    // 0 = unvisited, 1 = visiting (in recursion stack), 2 = visited
    const state = new Map<string, number>();
    for (const s of services) {
      state.set(s.name, 0);
    }

    const currentPath: string[] = [];

    const dfs = (node: string): string[] | null => {
      state.set(node, 1);
      currentPath.push(node);

      const service = serviceMap.get(node);
      const activeDeps = service ? this.getActiveDependencies(service, serviceMap) : [];

      for (const dep of activeDeps) {
        const depState = state.get(dep) ?? 0;
        if (depState === 1) {
          // Cycle found!
          const cycleStartIndex = currentPath.indexOf(dep);
          return [...currentPath.slice(cycleStartIndex), dep];
        }
        if (depState === 0) {
          const cycle = dfs(dep);
          if (cycle) {
            return cycle;
          }
        }
      }

      currentPath.pop();
      state.set(node, 2);
      return null;
    };

    for (const service of services) {
      if ((state.get(service.name) ?? 0) === 0) {
        const cycle = dfs(service.name);
        if (cycle) {
          throw new CircularDependencyError(cycle);
        }
      }
    }
  }

  /**
   * Returns list of dependencies for a service that are currently registered.
   * Required dependencies must already exist. Optional dependencies are included only if present.
   */
  private static getActiveDependencies(
    service: SystemService,
    serviceMap: Map<string, SystemService>
  ): string[] {
    const required = service.dependencies ?? [];
    const optional = (service.optionalDependencies ?? []).filter((name) => serviceMap.has(name));
    return [...required, ...optional];
  }
}
