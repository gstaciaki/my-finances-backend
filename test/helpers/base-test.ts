import { execSync } from 'child_process';
import { beforeEach } from '@jest/globals';

export function setupDatabaseLifecycle() {
  beforeEach(() => {
    console.log('[setup] Executando antes de cada teste...');
    execSync('yarn test:prepare', { stdio: 'inherit' });
  });
}
