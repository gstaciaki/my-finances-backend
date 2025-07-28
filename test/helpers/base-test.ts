import { beforeEach } from '@jest/globals';
import { execSync } from 'node:child_process';

export function setupDatabaseLifecycle() {
  beforeEach(async () => {
    if (process.env.NODE_ENV === 'test') {
      await resetDatabase();
    } else {
      console.warn('Reset do banco ignorado porque NODE_ENV não é "test"');
    }
  });
}

export async function resetDatabase() {
  try {
    execSync('DATABASE_URL=$DATABASE_URL_TEST yarn prisma migrate reset --force --skip-seed', {
      stdio: 'inherit',
    });
  } catch (err) {
    console.error('Erro ao resetar banco:', err);
    throw err;
  }
}
