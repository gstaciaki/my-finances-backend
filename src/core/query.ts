import { PrismaClient } from '@src/generated/prisma/client';

export abstract class BaseQuery<Input, Output> {
  constructor(protected readonly prisma: PrismaClient) {}

  abstract execute(input: Input): Promise<Output>;
}
