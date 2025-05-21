import { config } from 'dotenv';
import { execa } from 'execa';
import { Client } from 'pg';

config();

async function ensureDatabaseExists() {
  const dbUrl = new URL(process.env.DATABASE_URL_TEST!);
  const dbName = dbUrl.pathname.slice(1); // remove leading "/"

  const adminUrl = dbUrl.toString().replace(`/${dbName}`, '/postgres');

  const client = new Client({ connectionString: adminUrl });
  await client.connect();

  const dbs = await client.query(`SELECT 1 FROM pg_database WHERE datname='${dbName}'`);
  if (dbs.rowCount === 0) {
    console.log(`[reset-db] Criando banco de dados: ${dbName}`);
    await client.query(`CREATE DATABASE "${dbName}"`);
  }

  await client.end();
}

async function resetDatabase() {
  await waitForDatabase('db', 5432);

  const dbUrl = process.env.DATABASE_URL_TEST;

  await ensureDatabaseExists();

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

async function waitForDatabase(host: string, port: number, retries = 10, delay = 3000) {
  const net = await import('net');

  for (let i = 0; i < retries; i++) {
    const socket = new net.Socket();

    try {
      await new Promise<void>((resolve, reject) => {
        socket
          .setTimeout(delay)
          .once('error', reject)
          .once('timeout', reject)
          .connect(port, host, () => {
            socket.end();
            resolve();
          });
      });

      console.log('[wait-db] Banco de dados disponível');
      return;
    } catch (err) {
      console.log(`[wait-db] Aguardando banco... tentativa ${i + 1}`);
      await new Promise(res => setTimeout(res, delay));
    }
  }

  throw new Error('Banco de dados não está acessível após várias tentativas.');
}

resetDatabase();
