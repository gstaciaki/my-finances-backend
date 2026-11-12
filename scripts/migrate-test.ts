import 'dotenv/config';
import { spawnSync } from 'node:child_process';

const url = process.env.DATABASE_URL_TEST;

if (!url) {
  console.error('DATABASE_URL_TEST não definido. Copie o .env.example para .env.');
  process.exit(1);
}

const dbName = new URL(url).pathname.replace(/^\//, '');
if (!dbName.endsWith('_test')) {
  console.error(`Recusado: o banco "${dbName}" não termina em "_test".`);
  process.exit(1);
}

const result = spawnSync('pnpm', ['prisma', 'migrate', 'deploy'], {
  stdio: 'inherit',
  env: { ...process.env, DATABASE_URL: url },
});

process.exit(result.status ?? 1);
