/**
 * @file ServiceConfigSchema.ts
 * @description Runtime dynamic configuration schema validation and hot reload coordinator.
 */

export interface SchemaField {
  readonly key: string;
  readonly type: 'string' | 'number' | 'boolean' | 'object';
  readonly required?: boolean;
  readonly defaultValue?: unknown;
}

export class ServiceConfigSchema {
  private readonly schemas = new Map<string, SchemaField[]>();

  public registerSchema(serviceName: string, fields: SchemaField[]): void {
    this.schemas.set(serviceName, fields);
  }

  public validateConfig(serviceName: string, config: Record<string, unknown>): { valid: boolean; errors: string[] } {
    const fields = this.schemas.get(serviceName);
    if (!fields) return { valid: true, errors: [] };

    const errors: string[] = [];

    for (const field of fields) {
      const val = config[field.key];
      if (val === undefined || val === null) {
        if (field.required) {
          errors.push(`Field ${field.key} is required for service ${serviceName}`);
        }
      } else if (typeof val !== field.type) {
        errors.push(`Field ${field.key} expects ${field.type}, got ${typeof val}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
