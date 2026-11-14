import { BaseBusinessError } from './base-business.error';

export class Rollback extends BaseBusinessError {
  constructor(public readonly wrong: unknown) {
    super('rollback');
  }
}
