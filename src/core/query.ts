import { DbClient } from '@src/database';

export abstract class BaseQuery<Input, Output> {
  constructor(protected readonly prisma: DbClient) {}

  abstract execute(input: Input): Promise<Output>;
}
