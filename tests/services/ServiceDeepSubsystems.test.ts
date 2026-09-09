import { describe, expect, it } from 'vitest';
import {
  ServiceSupervisor,
  ServiceDependencyGraph,
  ServiceHealthChecker,
  ServiceSocketActivator,
} from '../../core/services/index.js';

describe('Services Deep Subsystems', () => {
  it('ServiceSupervisor restarts failed services with exponential backoff up to maxRestarts', () => {
    const supervisor = new ServiceSupervisor();

    supervisor.supervise({
      name: 'network-daemon',
      restartPolicy: 'on-failure',
      maxRestarts: 3,
      backoffMs: 100,
    });

    const r1 = supervisor.handleFailure('network-daemon');
    expect(r1.shouldRestart).toBe(true);
    expect(r1.delayMs).toBe(100);

    const r2 = supervisor.handleFailure('network-daemon');
    expect(r2.shouldRestart).toBe(true);
    expect(r2.delayMs).toBe(200);

    const r3 = supervisor.handleFailure('network-daemon');
    expect(r3.shouldRestart).toBe(true);
    expect(r3.delayMs).toBe(400);

    const r4 = supervisor.handleFailure('network-daemon');
    expect(r4.shouldRestart).toBe(false); // Exceeded maxRestarts
    expect(supervisor.getState('network-daemon')?.isFailed).toBe(true);
  });

  it('ServiceDependencyGraph sorts startup order topologically and detects cycles', () => {
    const graph = new ServiceDependencyGraph();

    graph.addService('auth', ['storage']);
    graph.addService('storage', ['eventbus']);
    graph.addService('eventbus', []);

    const order = graph.getStartupOrder();
    expect(order.indexOf('eventbus')).toBeLessThan(order.indexOf('storage'));
    expect(order.indexOf('storage')).toBeLessThan(order.indexOf('auth'));

    const cyclicGraph = new ServiceDependencyGraph();
    cyclicGraph.addService('A', ['B']);
    cyclicGraph.addService('B', ['A']);
    expect(() => cyclicGraph.getStartupOrder()).toThrowError(/Circular service dependency/);
  });

  it('ServiceHealthChecker registers liveness probes and tracks consecutive failures', async () => {
    const checker = new ServiceHealthChecker();
    let isHealthy = true;

    checker.registerProbe('db-service', () => isHealthy, 2);

    expect(await checker.runCheck('db-service')).toBe(true);
    expect(checker.isServiceHealthy('db-service')).toBe(true);

    isHealthy = false;
    // 1st failure (threshold is 2)
    expect(await checker.runCheck('db-service')).toBe(true);

    // 2nd failure (threshold reached)
    expect(await checker.runCheck('db-service')).toBe(false);
    expect(checker.isServiceHealthy('db-service')).toBe(false);
  });

  it('ServiceSocketActivator lazily activates daemon services upon connection request', () => {
    const activator = new ServiceSocketActivator();
    let startedService = '';

    activator.registerSocket('/var/run/cups.sock', 'cupsd');

    expect(activator.isServiceActive('cupsd')).toBe(false);

    activator.onConnection('/var/run/cups.sock', (name) => {
      startedService = name;
    });

    expect(startedService).toBe('cupsd');
    expect(activator.isServiceActive('cupsd')).toBe(true);

    activator.markServiceStopped('cupsd');
    expect(activator.isServiceActive('cupsd')).toBe(false);
  });
});
