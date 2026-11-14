import { BaseBusinessError } from './base-business.error';

export class ForbiddenOperationError extends BaseBusinessError {
  constructor(message: string) {
    super(`Forbidden Operation: ${message}`);
  }
}
