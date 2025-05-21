import { beforeEach } from '@jest/globals';
import { prismaTest } from 'jest.setup';

const prisma = prismaTest;
export function setupDatabaseLifecycle() {
  beforeEach(async () => {
    await cleanDatabase();
  });
}

export async function cleanDatabase() {
  const modelKeys = Object.keys(prisma).filter(
    key =>
      typeof prisma[key as keyof typeof prisma] === 'object' &&
      // @ts-ignore
      typeof prisma[key as keyof typeof prisma]?.deleteMany === 'function',
  );

  for (const model of modelKeys) {
    // @ts-ignore
    await prisma[model].deleteMany();
  }
}
