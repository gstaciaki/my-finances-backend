import { execa } from 'execa';

async function resetDatabase() {
  const dbUrl =
    process.env.DATABASE_URL ||
    'postgresql://myfinances_user:myfinances_password@localhost:5432/myfinances_test';
  if (!dbUrl) throw new Error('DATABASE_URL not set');

  console.log('[reset-db] Resetando banco de dados via Prisma...');

  try {
    await execa(
      'yarn',
      ['prisma', 'migrate', 'reset', '--force', '--skip-seed', '--schema=prisma/schema.prisma'],
      {
        env: {
          ...process.env,
          DATABASE_URL: dbUrl,
        },
      },
    );

    console.log('[reset-db] Banco de dados resetado com sucesso!');
  } catch (err) {
    console.error('[reset-db] Erro ao resetar banco:', err);
    process.exit(1);
  }
}

resetDatabase();
