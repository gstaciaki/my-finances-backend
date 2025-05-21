import { execSync } from 'child_process';
import { beforeAll, beforeEach } from '@jest/globals';
import { prismaTest } from 'jest.setup';

const prisma = prismaTest;
export function setupDatabaseLifecycle() {
  beforeAll(() => {
    // Removed to stop errors on CI
    // console.log('[setup] Executando antes de todos os testes...');
    // execSync('yarn test:prepare', { stdio: 'inherit' });
  });
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
