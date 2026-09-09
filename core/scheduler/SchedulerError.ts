/**
 * @file SchedulerError.ts
 * @description Exception hierarchy for the WebOS Process Scheduler subsystem.
 */

export class SchedulerError extends Error {
  public readonly code: string;
  public readonly timestamp: number;

  constructor(message: string, code = 'SCHEDULER_ERROR') {
    super(message);
    this.name = 'SchedulerError';
    this.code = code;
    this.timestamp = Date.now();
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class InvalidSchedulerStateError extends SchedulerError {
  constructor(currentState: string, expectedState: string, action: string) {
    super(
      `Cannot perform action '${action}' while scheduler is in state '${currentState}' (expected '${expectedState}')`,
      'INVALID_SCHEDULER_STATE'
    );
    this.name = 'InvalidSchedulerStateError';
  }
}

export class ProcessSchedulingError extends SchedulerError {
  public readonly pid: number;

  constructor(pid: number, message: string) {
    super(`Scheduling error for PID ${pid}: ${message}`, 'PROCESS_SCHEDULING_ERROR');
    this.name = 'ProcessSchedulingError';
    this.pid = pid;
  }
}

export class ProcessNotScheduledError extends SchedulerError {
  public readonly pid: number;

  constructor(pid: number) {
    super(`Process PID ${pid} is not registered with the scheduler`, 'PROCESS_NOT_SCHEDULED');
    this.name = 'ProcessNotScheduledError';
    this.pid = pid;
  }
}
