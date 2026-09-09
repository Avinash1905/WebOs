/**
 * WebOS Core - Process Manager Engine
 * Master process lifecycle orchestrator managing PIDs, PCB hierarchy, forking, and execution promises.
 */

import { ProcessControlBlock } from './pcb';
import { ProcessLaunchParams, ProcessPriority, Signal } from './types';
import { scheduler } from './scheduler';
import { signalManager } from './signalManager';

export class ProcessManager {
  private static instance: ProcessManager;
  private processes: Map<number, ProcessControlBlock> = new Map();
  private nextPid: number = 1;

  private constructor() {
    this.bootstrapInitProcess();
    scheduler.start();
  }

  public static getInstance(): ProcessManager {
    if (!ProcessManager.instance) {
      ProcessManager.instance = new ProcessManager();
    }
    return ProcessManager.instance;
  }

  private bootstrapInitProcess() {
    const init = new ProcessControlBlock(
      this.nextPid++,
      0,
      'init',
      '/sbin/init',
      [],
      { PATH: '/bin:/usr/bin:/sbin', USER: 'root', HOME: '/root' },
      '/',
      0,
      0,
      'realtime'
    );
    init.state = 'running';
    this.processes.set(init.pid, init);
  }

  public spawn(params: ProcessLaunchParams): ProcessControlBlock {
    const pid = this.nextPid++;
    const ppid = params.parentPid ?? 1;

    const pcb = new ProcessControlBlock(
      pid,
      ppid,
      params.name,
      params.command,
      params.args ?? [],
      params.env ?? { PATH: '/bin:/usr/bin', USER: 'user', HOME: '/home/user' },
      params.cwd ?? '/home/user',
      params.uid ?? 1000,
      params.gid ?? 1000,
      params.priority ?? 'normal'
    );

    const parent = this.processes.get(ppid);
    if (parent) {
      parent.childPids.add(pid);
    }

    if (params.execute) {
      pcb.executeFunction = params.execute;
      pcb.executionPromise = params.execute(pcb)
        .then((res) => {
          pcb.terminate(typeof res === 'number' ? res : 0);
          scheduler.remove(pcb);
        })
        .catch((err) => {
          console.error(`Process ${pcb.pid} failed:`, err);
          pcb.terminate(1);
          scheduler.remove(pcb);
        });
    }

    this.processes.set(pid, pcb);
    scheduler.enqueue(pcb);

    return pcb;
  }

  public fork(parentPid: number): ProcessControlBlock {
    const parent = this.processes.get(parentPid);
    if (!parent) {
      throw new Error(`ESRCH: No such process ${parentPid}`);
    }

    const pid = this.nextPid++;
    const child = new ProcessControlBlock(
      pid,
      parentPid,
      `${parent.name}_fork`,
      parent.command,
      [...parent.args],
      Object.fromEntries(parent.env),
      parent.cwd,
      parent.uid,
      parent.gid,
      parent.priority
    );

    parent.childPids.add(pid);
    this.processes.set(pid, child);
    scheduler.enqueue(child);

    return child;
  }

  public kill(pid: number, signal: Signal = Signal.SIGTERM): boolean {
    const pcb = this.processes.get(pid);
    if (!pcb) return false;

    const handled = signalManager.sendSignal(pcb, signal);
    if (pcb.state === 'terminated') {
      scheduler.remove(pcb);
    }
    return handled;
  }

  public getProcess(pid: number): ProcessControlBlock | undefined {
    return this.processes.get(pid);
  }

  public listProcesses(): ProcessControlBlock[] {
    return Array.from(this.processes.values());
  }

  public setPriority(pid: number, priority: ProcessPriority): boolean {
    const pcb = this.processes.get(pid);
    if (!pcb) return false;
    pcb.setPriority(priority);
    return true;
  }

  public async waitpid(pid: number): Promise<number> {
    const pcb = this.processes.get(pid);
    if (!pcb) throw new Error(`ESRCH: No such process ${pid}`);
    if (pcb.state === 'terminated') return pcb.exitCode ?? 0;

    if (pcb.executionPromise) {
      await pcb.executionPromise;
      return pcb.exitCode ?? 0;
    }

    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (pcb.state === 'terminated') {
          clearInterval(checkInterval);
          resolve(pcb.exitCode ?? 0);
        }
      }, 50);
    });
  }

  public cleanupZombies(): number {
    let count = 0;
    for (const [pid, pcb] of this.processes.entries()) {
      if (pcb.state === 'terminated' && pid !== 1) {
        this.processes.delete(pid);
        count++;
      }
    }
    return count;
  }
}

export const processManager = ProcessManager.getInstance();
