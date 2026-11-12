import { PrismaClient } from '@src/generated/prisma/client';
import { truncateAllTables } from '@src/database/truncate';
import { prismaTest } from 'jest.setup';

const prisma = prismaTest;

export function setupDatabaseLifecycle() {
  beforeEach(async () => {
    await cleanDatabase(prisma);
  });
}

export async function assertTestDatabase(prisma: PrismaClient) {
  const [row] = await prisma.$queryRaw<Array<{ current_database: string }>>`
    SELECT current_database()
  `;

  if (!row?.current_database.endsWith('_test')) {
    throw new Error(`Limpeza recusada: o banco "${row?.current_database}" não termina em "_test".`);
  }
}

export async function cleanDatabase(prisma: PrismaClient) {
  await assertTestDatabase(prisma);
  await truncateAllTables(prisma);
}
