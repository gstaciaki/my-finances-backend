import { config } from 'dotenv';
import { execa } from 'execa';
import { Client } from 'pg';

config();

const dbUrl = new URL(process.env.DATABASE_URL_TEST!);
const dbName = dbUrl.pathname.slice(1);
const adminUrl = dbUrl.toString().replace(`/${dbName}`, '/postgres');

async function ensureDatabaseExists() {
  const client = new Client({ connectionString: adminUrl });
  await client.connect();

  const res = await client.query(`SELECT 1 FROM pg_database WHERE datname='${dbName}'`);
  if (res.rowCount === 0) {
    console.log(`[reset-db] Criando banco de dados: ${dbName}`);
    await client.query(`CREATE DATABASE "${dbName}"`);
  }

  await client.end();
}

async function resetDatabase() {
  console.log('[debug] DATABASE_URL_TEST =', process.env.DATABASE_URL_TEST);

  await ensureDatabaseExists();

  console.log('[reset-db] Resetando banco de dados via Prisma...');
  try {
    await execa('yarn', ['prisma', 'migrate', 'reset', '--force', '--skip-seed', '--schema=prisma/schema.prisma'], {
      env: {
        ...process.env,
        DATABASE_URL: process.env.DATABASE_URL_TEST,
      },
    });
    console.log('[reset-db] Banco de dados resetado com sucesso!');
  } catch (err) {
    console.error('[reset-db] Erro ao resetar banco:', err);
    process.exit(1);
  }
}

resetDatabase();
