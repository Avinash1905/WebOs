/**
 * @file TrashError.ts
 * @description Typed error hierarchy for the WebOS Trash & Recovery Subsystem.
 */

export class TrashError extends Error {
  public override readonly name: string = 'TrashError';

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class TrashItemNotFoundError extends TrashError {
  public override readonly name = 'TrashItemNotFoundError';

  constructor(trashId: string) {
    super(`Trash item not found: ${trashId}`);
  }
}

export class TrashEmptyError extends TrashError {
  public override readonly name = 'TrashEmptyError';

  constructor() {
    super('Trash is already empty');
  }
}
