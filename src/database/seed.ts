import * as readline from 'readline';
import { env } from '@src/config/env';
import { truncateAllTables } from './truncate';
import { usersSeed } from './seeds/user.seed';
import { prismaRaw as prisma } from './raw';

function askConfirmation(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

async function main() {
  if (env.NODE_ENV === 'production') {
    throw new Error('O seed de desenvolvimento não roda em produção.');
  }

  console.log('ATTENTION: this operation will purge all data on database');

  const confirmed = await askConfirmation('Are you sure? (y/N): ');

  if (!confirmed) {
    process.exit(0);
  }

  console.log('Cleaning database...');
  await truncateAllTables(prisma);

  console.log('Starting seeds...');
  await usersSeed();
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
