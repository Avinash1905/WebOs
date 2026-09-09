/**
 * @file ServiceDependencyGraph.ts
 * @description Directed Acyclic Graph topological sorter and cycle detector for system services.
 */

export class ServiceDependencyGraph {
  private readonly _adjList = new Map<string, Set<string>>(); // service -> dependencies

  public addService(name: string, dependencies: readonly string[] = []): void {
    let deps = this._adjList.get(name);
    if (!deps) {
      deps = new Set();
      this._adjList.set(name, deps);
    }
    for (const d of dependencies) {
      deps.add(d);
    }
  }

  public getStartupOrder(): string[] {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const order: string[] = [];

    const visit = (node: string) => {
      if (visiting.has(node)) {
        throw new Error(`Circular service dependency detected on '${node}'`);
      }
      if (!visited.has(node)) {
        visiting.add(node);
        const deps = this._adjList.get(node);
        if (deps) {
          for (const dep of deps) {
            visit(dep);
          }
        }
        visiting.delete(node);
        visited.add(node);
        order.push(node);
      }
    };

    for (const node of this._adjList.keys()) {
      if (!visited.has(node)) {
        visit(node);
      }
    }

    return order;
  }
}
