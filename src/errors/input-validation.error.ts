import { ZodError, ZodIssue } from 'zod';
import { BaseBusinessError } from './base-business.error';

export class InputValidationError extends BaseBusinessError {
  public readonly issues: ZodIssue[];
  public readonly formatted: Record<string, string[]>;

  constructor(error: ZodError) {
    super('Um ou mais dados de entrada são inválidos.');
    this.name = 'InputValidationError';
    this.issues = error.issues;
    this.formatted = InputValidationError.formatIssues(error);

    Error.captureStackTrace?.(this, InputValidationError);
  }

  private static formatIssues(error: ZodError): Record<string, string[]> {
    const fieldErrors: Record<string, string[]> = {};

    for (const issue of error.issues) {
      const key = issue.path.length > 0 ? String(issue.path[0]) : 'form';
      if (!fieldErrors[key]) fieldErrors[key] = [];
      fieldErrors[key].push(issue.message);
    }

    return fieldErrors;
  }

  public toJSON() {
    return {
      message: this.message,
      errors: this.formatted,
    };
  }
}
