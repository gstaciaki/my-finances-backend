import { PrismaClient } from '@src/generated/prisma/client';

/**
 * Esvazia todas as tabelas do schema public, menos o histórico de migrations.
 * Não verifica em qual banco está: quem chama é responsável pela guarda
 * (ver `cleanDatabase` em test/helpers e o seed).
 */
export async function truncateAllTables(prisma: PrismaClient) {
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
