/**
 * @file EventSchemaRegistry.ts
 * @description JSON Schema-style event validation and schema contract enforcer.
 */

export interface EventFieldDefinition {
  readonly name: string;
  readonly type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  readonly required?: boolean;
}

export class EventSchemaRegistry {
  private readonly schemas = new Map<string, EventFieldDefinition[]>();

  public registerSchema(eventType: string, fields: EventFieldDefinition[]): void {
    this.schemas.set(eventType, fields);
  }

  public validate(eventType: string, payload: unknown): { valid: boolean; errors: string[] } {
    const fields = this.schemas.get(eventType);
    if (!fields) return { valid: true, errors: [] }; // Unregistered schemas pass by default

    if (!payload || typeof payload !== 'object') {
      return { valid: false, errors: ['Payload must be an object'] };
    }

    const errors: string[] = [];
    const obj = payload as Record<string, unknown>;

    for (const field of fields) {
      const val = obj[field.name];
      if (val === undefined || val === null) {
        if (field.required) {
          errors.push(`Field ${field.name} is required for event ${eventType}`);
        }
      } else {
        if (field.type === 'array' && !Array.isArray(val)) {
          errors.push(`Field ${field.name} must be an array`);
        } else if (field.type !== 'array' && typeof val !== field.type) {
          errors.push(`Field ${field.name} expects ${field.type}, received ${typeof val}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
