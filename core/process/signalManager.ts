/**
 * WebOS Core - Signal Dispatcher & Handler System
 * Implements standard POSIX signals (SIGINT, SIGTERM, SIGKILL, SIGSTOP, SIGCONT, SIGHUP).
 */

import { Signal } from './types';
import { ProcessControlBlock } from './pcb';

export class SignalManager {
  private static instance: SignalManager;

  private constructor() {}

  public static getInstance(): SignalManager {
    if (!SignalManager.instance) {
      SignalManager.instance = new SignalManager();
    }
    return SignalManager.instance;
  }

  /**
   * Dispatches a signal to a target process PCB.
   */
  public sendSignal(pcb: ProcessControlBlock, signal: Signal): boolean {
    if (pcb.state === 'terminated' || pcb.state === 'zombie') {
      return false;
    }

    // SIGKILL cannot be caught or ignored
    if (signal === Signal.SIGKILL) {
      pcb.terminate(128 + Signal.SIGKILL);
      return true;
    }

    // SIGSTOP cannot be caught or ignored
    if (signal === Signal.SIGSTOP) {
      pcb.state = 'stopped';
      return true;
    }

    // SIGCONT wakes stopped processes
    if (signal === Signal.SIGCONT) {
      if (pcb.state === 'stopped') {
        pcb.state = 'ready';
      }
      return true;
    }

    // Check custom registered handler
    const customHandler = pcb.signalHandlers.get(signal);
    if (customHandler) {
      try {
        customHandler(signal);
        return true;
      } catch (err) {
        console.error(`Error in signal handler for PID ${pcb.pid}:`, err);
      }
    }

    // Default POSIX Actions
    switch (signal) {
      case Signal.SIGINT:
      case Signal.SIGTERM:
      case Signal.SIGHUP:
      case Signal.SIGQUIT:
        pcb.terminate(128 + signal);
        return true;

      case Signal.SIGTSTP:
        pcb.state = 'stopped';
        return true;

      case Signal.SIGCHLD:
      case Signal.SIGUSR1:
      case Signal.SIGUSR2:
      case Signal.SIGALRM:
        // Default: Ignore
        return true;

      default:
        pcb.terminate(1);
        return true;
    }
  }
}

export const signalManager = SignalManager.getInstance();
