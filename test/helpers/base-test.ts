import { PrismaClient } from '@prisma/client';
import { prismaTest } from 'jest.setup';

const prisma = prismaTest;

export function setupDatabaseLifecycle() {
  beforeEach(async () => {
    await cleanDatabase(prisma);
  });
}

export async function cleanDatabase(prisma: PrismaClient) {
  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables WHERE schemaname='public'
    `;

  const tableNames = tables
    .filter(t => t.tablename !== '_prisma_migrations')
    .map(t => `"${t.tablename}"`)
    .join(', ');

  if (tableNames) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE;`);
  }
}
